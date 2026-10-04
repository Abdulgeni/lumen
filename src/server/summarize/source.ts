import { countWords } from "@/lib/words";
import type { SourceType } from "@/lib/summary-options";
import { ApiFailure } from "../api/failure";
import type { Attachment } from "../ai/stream";
import { extractFromFile, FileExtractionError } from "../extract/document";
import { extractArticle, normalizeText } from "../extract/html";
import { decodeBody, SafeFetchError, safeFetch } from "../net/safe-fetch";

export type SourceInput =
  | { sourceType: "TEXT"; text: string }
  | { sourceType: "URL"; url: string }
  | { sourceType: "FILE"; file: { name: string; bytes: Uint8Array } };

export type PreparedSource = {
  sourceType: SourceType;
  text: string;
  attachments: Attachment[];
  titleHint: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  excerpt: string | null;
  inputChars: number;
  inputWords: number;
};

const PDF_PLACEHOLDER = "(The source document is attached to this message as a PDF file.)";

function fromFetchError(error: SafeFetchError): ApiFailure {
  switch (error.code) {
    case "INVALID_URL":
    case "BLOCKED_HOST":
      return new ApiFailure(400, "INVALID_URL", error.message);
    case "TOO_LARGE":
      return new ApiFailure(413, "SOURCE_TOO_LARGE", error.message);
    case "UNSUPPORTED_CONTENT":
      return new ApiFailure(415, "UNSUPPORTED_SOURCE", error.message);
    default:
      return new ApiFailure(422, "URL_UNREACHABLE", error.message);
  }
}

function fromFileError(error: FileExtractionError): ApiFailure {
  return error.code === "UNSUPPORTED_FILE"
    ? new ApiFailure(415, "UNSUPPORTED_SOURCE", error.message)
    : new ApiFailure(422, "UNREADABLE_FILE", error.message);
}

function fromText(
  text: string,
  base: Omit<PreparedSource, "text" | "excerpt" | "inputChars" | "inputWords" | "attachments">,
): PreparedSource {
  const clean = normalizeText(text);
  return {
    ...base,
    text: clean,
    attachments: [],
    excerpt: clean.slice(0, 500) || null,
    inputChars: clean.length,
    inputWords: countWords(clean),
  };
}

/** Turns any supported input into text (or a PDF attachment). All network and parsing risk lives here. */
export async function prepareSource(input: SourceInput): Promise<PreparedSource> {
  const empty = { titleHint: null, sourceUrl: null, sourceName: null };

  if (input.sourceType === "TEXT") {
    return fromText(input.text, { ...empty, sourceType: "TEXT" });
  }

  if (input.sourceType === "URL") {
    try {
      const page = await safeFetch(input.url);
      const article = extractArticle(decodeBody(page.bytes, page.contentType));
      if (!article.text) {
        throw new ApiFailure(
          422,
          "NO_READABLE_CONTENT",
          "We could not find readable text at that link. Try pasting the text instead.",
        );
      }
      return fromText(article.text, {
        sourceType: "URL",
        titleHint: article.title,
        sourceUrl: input.url.trim().slice(0, 2048),
        sourceName: new URL(page.url).hostname,
      });
    } catch (error) {
      if (error instanceof SafeFetchError) throw fromFetchError(error);
      throw error;
    }
  }

  try {
    const extracted = await extractFromFile(input.file);
    if (extracted.kind === "pdf") {
      return {
        sourceType: "FILE",
        text: PDF_PLACEHOLDER,
        attachments: [{ mimeType: "application/pdf", data: extracted.bytes }],
        titleHint: input.file.name.replace(/\.[^.]+$/, ""),
        sourceUrl: null,
        sourceName: input.file.name.slice(0, 200),
        excerpt: null,
        inputChars: 0,
        inputWords: 0,
      };
    }
    return fromText(extracted.text, {
      sourceType: "FILE",
      titleHint: extracted.title,
      sourceUrl: null,
      sourceName: input.file.name.slice(0, 200),
    });
  } catch (error) {
    if (error instanceof FileExtractionError) throw fromFileError(error);
    throw error;
  }
}
