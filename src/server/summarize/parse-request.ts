import { checkEntitlements } from "@/lib/plans";
import {
  createSummaryJsonSchema,
  MAX_TEXT_CHARS,
  type SummaryOptions,
  summaryOptionsSchema,
} from "@/lib/validation/summary";
import { ApiFailure, parseOrThrow } from "../api/http";
import type { Entitlement } from "../entitlements";
import type { SourceInput } from "./source";

const MAX_JSON_CHARS = MAX_TEXT_CHARS + 10_000;

function formString(form: FormData, name: string): string | undefined {
  const value = form.get(name);
  return typeof value === "string" && value !== "" ? value : undefined;
}

export async function parseCreateRequest(
  request: Request,
  entitlement: Entitlement,
): Promise<{ options: SummaryOptions; source: SourceInput }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    // Refuse before reading the body if this plan cannot upload files at all.
    const early = checkEntitlements(entitlement.planId, {
      mode: "EXECUTIVE_BRIEF",
      sourceType: "FILE",
      inputWords: 0,
    });
    if (early?.code === "SOURCE_NOT_ALLOWED") {
      throw new ApiFailure(402, early.code, early.message, { upgradeTo: early.upgradeTo });
    }

    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > entitlement.plan.maxFileBytes + 64 * 1024) {
      throw new ApiFailure(413, "FILE_TOO_LARGE", "That file is too large for your plan.");
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiFailure(400, "INVALID_REQUEST", "Attach a file to summarize.");
    }
    const options = parseOrThrow(summaryOptionsSchema, {
      mode: formString(form, "mode"),
      length: formString(form, "length"),
      tone: formString(form, "tone"),
      language: formString(form, "language"),
    });
    return {
      options,
      source: {
        sourceType: "FILE",
        file: { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) },
      },
    };
  }

  if (!contentType.startsWith("application/json")) {
    throw new ApiFailure(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Send JSON, or multipart form data for files.",
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_JSON_CHARS) {
    throw new ApiFailure(413, "INPUT_TOO_LONG", "That input is too large.");
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ApiFailure(400, "INVALID_REQUEST", "The request body is not valid JSON.");
  }

  const data = parseOrThrow(createSummaryJsonSchema, json);
  const options: SummaryOptions = {
    mode: data.mode,
    length: data.length,
    tone: data.tone,
    language: data.language,
  };
  return data.sourceType === "TEXT"
    ? { options, source: { sourceType: "TEXT", text: data.text } }
    : { options, source: { sourceType: "URL", url: data.url } };
}
