export type GenerationErrorCode =
  "MODEL_UNAVAILABLE" | "RATE_LIMITED" | "BLOCKED" | "EMPTY_OUTPUT" | "UPSTREAM_ERROR" | "ABORTED";

export class GenerationError extends Error {
  constructor(
    readonly code: GenerationErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "GenerationError";
  }
}

export type Attachment = { mimeType: string; data: Uint8Array };

function buildContents(userContent: string, attachments: Attachment[] | undefined): unknown {
  if (!attachments?.length) return userContent;
  return [
    {
      role: "user",
      parts: [
        ...attachments.map((a) => ({
          inlineData: { mimeType: a.mimeType, data: Buffer.from(a.data).toString("base64") },
        })),
        { text: userContent },
      ],
    },
  ];
}

export type GenAiChunk = {
  text?: string | undefined;
  usageMetadata?:
    | { promptTokenCount?: number | undefined; candidatesTokenCount?: number | undefined }
    | undefined;
  candidates?: { finishReason?: string | undefined }[] | undefined;
  promptFeedback?: { blockReason?: string | undefined } | undefined;
};

/** The small slice of the Google SDK we depend on, so tests can substitute a fake. */
export type GenAiLike = {
  models: {
    generateContentStream(params: {
      model: string;
      contents: unknown;
      config?: Record<string, unknown>;
    }): Promise<AsyncIterable<GenAiChunk>>;
  };
};

export type StreamEvent =
  | { type: "text"; text: string }
  | {
      type: "done";
      model: string;
      inputTokens: number | null;
      outputTokens: number | null;
      finishReason: string | null;
    };

const BLOCKED_REASONS = new Set([
  "SAFETY",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
  "RECITATION",
  "IMAGE_SAFETY",
]);

function statusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : undefined;
}

/** Errors worth retrying on the fallback model, but only if no text has been sent yet. */
function shouldTryNextModel(error: unknown): boolean {
  const status = statusOf(error);
  return status === 404 || status === 429 || status === 503;
}

function toGenerationError(error: unknown): GenerationError {
  if (error instanceof GenerationError) return error;
  const status = statusOf(error);
  if (status === 429)
    return new GenerationError("RATE_LIMITED", "The AI service is busy.", { cause: error });
  if (status === 404)
    return new GenerationError("MODEL_UNAVAILABLE", "The AI model is unavailable.", {
      cause: error,
    });
  return new GenerationError("UPSTREAM_ERROR", "The AI service failed to respond.", {
    cause: error,
  });
}

export async function* streamSummary(
  ai: GenAiLike,
  params: {
    models: { primary: string; fallback?: string | undefined };
    systemInstruction: string;
    userContent: string;
    attachments?: Attachment[] | undefined;
    signal?: AbortSignal | undefined;
    maxOutputTokens?: number;
  },
): AsyncGenerator<StreamEvent> {
  const { primary, fallback } = params.models;
  const candidates = fallback && fallback !== primary ? [primary, fallback] : [primary];
  const contents = buildContents(params.userContent, params.attachments);
  let lastError: unknown;

  for (const model of candidates) {
    let emitted = 0;
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: params.systemInstruction,
          maxOutputTokens: params.maxOutputTokens ?? 16_384,
          abortSignal: params.signal,
        },
      });

      let inputTokens: number | null = null;
      let outputTokens: number | null = null;
      let finishReason: string | null = null;
      let promptBlocked = false;

      for await (const chunk of stream) {
        if (chunk.promptFeedback?.blockReason) promptBlocked = true;
        if (chunk.usageMetadata) {
          inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
          outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
        }
        finishReason = chunk.candidates?.[0]?.finishReason ?? finishReason;
        if (chunk.text) {
          emitted += chunk.text.length;
          yield { type: "text", text: chunk.text };
        }
      }

      if (emitted === 0) {
        if (promptBlocked || (finishReason && BLOCKED_REASONS.has(finishReason))) {
          throw new GenerationError("BLOCKED", "The content could not be summarized.");
        }
        throw new GenerationError("EMPTY_OUTPUT", "The model returned no text.");
      }

      yield { type: "done", model, inputTokens, outputTokens, finishReason };
      return;
    } catch (error) {
      if (params.signal?.aborted) {
        throw new GenerationError("ABORTED", "Generation was cancelled.", { cause: error });
      }
      lastError = error;
      if (emitted > 0 || !shouldTryNextModel(error)) throw toGenerationError(error);
    }
  }

  throw toGenerationError(lastError);
}
