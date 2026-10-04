import { checkEntitlements, type ModelTier, nextPlan } from "@/lib/plans";
import type { SummaryOptions } from "@/lib/validation/summary";
import { fallbackTitle, makePreview } from "@/lib/text";
import { buildSummaryPrompt, splitTitle } from "../ai/prompt";
import { type Attachment, GenerationError, type StreamEvent } from "../ai/stream";
import { ApiFailure } from "../api/failure";
import { db } from "../db";
import type { Entitlement } from "../entitlements";
import type { RateLimitPolicy, RateLimitResult } from "../rate-limit";
import { reserveUsage } from "../usage";
import type { PreparedSource, SourceInput } from "./source";

export type SummaryEvent =
  | { type: "start"; id: string }
  | { type: "delta"; text: string }
  | { type: "done"; id: string; title: string; truncated: boolean }
  | { type: "error"; code: string; message: string };

export type ServiceDeps = {
  generate: (params: {
    tier: ModelTier;
    systemInstruction: string;
    userContent: string;
    attachments?: Attachment[] | undefined;
    signal?: AbortSignal | undefined;
  }) => AsyncGenerator<StreamEvent>;
  rateLimit: (policies: RateLimitPolicy[], key: string) => Promise<RateLimitResult>;
  getEntitlement: (userId: string) => Promise<Entitlement>;
  prepareSource: (input: SourceInput) => Promise<PreparedSource>;
};

export type ServiceConfig = { maxInFlight: number; inFlightWindowMs: number; minWords: number };

const DEFAULT_CONFIG: ServiceConfig = { maxInFlight: 2, inFlightWindowMs: 120_000, minWords: 20 };

const USER_MESSAGES: Record<string, string> = {
  RATE_LIMITED: "Our AI service is busy right now. Please try again in a moment.",
  BLOCKED: "This content could not be summarized.",
  EMPTY_OUTPUT: "The AI returned no result. Please try again.",
  ABORTED: "Summary cancelled.",
};

function userMessage(code: string): string {
  return USER_MESSAGES[code] ?? "We could not generate this summary. Please try again.";
}

function logDbFailure(error: unknown) {
  console.error(
    "[summarize] database cleanup failed:",
    error instanceof Error ? error.name : "unknown",
  );
}

export function createSummaryService(deps: ServiceDeps, overrides: Partial<ServiceConfig> = {}) {
  const config = { ...DEFAULT_CONFIG, ...overrides };

  /**
   * Validates, meters and records a request, then returns the event stream.
   * Anything that goes wrong before generation starts throws an ApiFailure.
   */
  async function start(input: {
    userId: string;
    options: SummaryOptions;
    source: SourceInput;
    signal?: AbortSignal | undefined;
  }): Promise<{ id: string; events: AsyncGenerator<SummaryEvent> }> {
    const { userId, options, source: sourceInput } = input;
    const { plan, planId, period } = await deps.getEntitlement(userId);

    // 1. Cheap checks first: nothing below costs money or network until these pass.
    const fileBytes =
      sourceInput.sourceType === "FILE" ? sourceInput.file.bytes.byteLength : undefined;
    const early = checkEntitlements(planId, {
      mode: options.mode,
      sourceType: sourceInput.sourceType,
      inputWords: 0,
      ...(fileBytes !== undefined && { fileBytes }),
    });
    if (early) throw new ApiFailure(402, early.code, early.message, { upgradeTo: early.upgradeTo });

    const limited = await deps.rateLimit(["summarizePerMinute", "summarizePerHour"], userId);
    if (!limited.ok) {
      throw new ApiFailure(
        429,
        "RATE_LIMITED",
        "You are going a little fast. Please wait a moment.",
        { retryAfterSeconds: limited.retryAfterSeconds },
      );
    }

    const inFlight = await db.summary.count({
      where: {
        userId,
        status: "PENDING",
        createdAt: { gte: new Date(Date.now() - config.inFlightWindowMs) },
      },
    });
    if (inFlight >= config.maxInFlight) {
      throw new ApiFailure(
        429,
        "TOO_MANY_IN_FLIGHT",
        "Please wait for your current summaries to finish.",
        { retryAfterSeconds: 10 },
      );
    }

    // 2. Fetch or extract the source.
    const source = await deps.prepareSource(sourceInput);

    // 3. Size checks need the real word count. PDFs are bounded by file size instead.
    if (source.attachments.length === 0) {
      if (source.inputWords < config.minWords) {
        throw new ApiFailure(
          422,
          "INPUT_TOO_SHORT",
          `Add a little more text to summarize (at least ${config.minWords} words).`,
        );
      }
      const late = checkEntitlements(planId, {
        mode: options.mode,
        sourceType: source.sourceType,
        inputWords: source.inputWords,
      });
      if (late) throw new ApiFailure(402, late.code, late.message, { upgradeTo: late.upgradeTo });
    }

    // 4. Atomically claim one unit of quota.
    const reserved = await reserveUsage({ userId, limit: plan.monthlySummaries, period });
    if (!reserved.ok) {
      throw new ApiFailure(
        402,
        "QUOTA_EXCEEDED",
        `You have used all ${reserved.limit} summaries for this period.`,
        {
          used: reserved.used,
          limit: reserved.limit,
          upgradeTo: nextPlan(planId),
          resetsAt: period.end,
        },
      );
    }
    const { reservation } = reserved;

    // 5. Record the attempt.
    const fallback = fallbackTitle(source.titleHint, source.text);
    let row: { id: string };
    try {
      row = await db.summary.create({
        data: {
          userId,
          title: fallback,
          sourceType: source.sourceType,
          sourceUrl: source.sourceUrl,
          sourceName: source.sourceName,
          sourceExcerpt: source.excerpt,
          mode: options.mode,
          length: options.length,
          tone: options.tone,
          outputLanguage: options.language,
          status: "PENDING",
          inputChars: source.inputChars,
        },
        select: { id: true },
      });
    } catch (error) {
      await reservation.release().catch(logDbFailure);
      throw error;
    }

    const { systemInstruction, userContent } = buildSummaryPrompt({
      mode: options.mode,
      length: options.length,
      tone: options.tone,
      language: options.language,
      source: { type: source.sourceType, url: source.sourceUrl ?? undefined },
      text: source.text,
    });

    async function* run(): AsyncGenerator<SummaryEvent> {
      let settled = false;

      const fail = async (code: string) => {
        settled = true;
        await db.summary
          .update({
            where: { id: row.id },
            data: { status: "FAILED", errorCode: code, sourceExcerpt: null },
          })
          .catch(logDbFailure);
        await reservation.release().catch(logDbFailure);
      };

      try {
        yield { type: "start", id: row.id };

        let text = "";
        let finish: Extract<StreamEvent, { type: "done" }> | undefined;
        for await (const event of deps.generate({
          tier: plan.modelTier,
          systemInstruction,
          userContent,
          attachments: source.attachments,
          signal: input.signal,
        })) {
          if (event.type === "text") {
            text += event.text;
            yield { type: "delta", text: event.text };
          } else {
            finish = event;
          }
        }
        if (!finish) throw new GenerationError("EMPTY_OUTPUT", "The model returned no result.");

        const { title, body } = splitTitle(text, fallback);
        await db.summary.update({
          where: { id: row.id },
          data: {
            status: "COMPLETED",
            title,
            resultMarkdown: body,
            preview: makePreview(body),
            aiModel: finish.model,
            inputTokens: finish.inputTokens,
            outputTokens: finish.outputTokens,
          },
        });
        settled = true;
        yield { type: "done", id: row.id, title, truncated: finish.finishReason === "MAX_TOKENS" };
      } catch (error) {
        const code = error instanceof GenerationError ? error.code : "INTERNAL";
        await fail(code);
        yield { type: "error", code, message: userMessage(code) };
      } finally {
        // The consumer stopped reading (browser closed): treat it as a cancellation.
        if (!settled) await fail("ABORTED");
      }
    }

    return { id: row.id, events: run() };
  }

  return { start };
}
