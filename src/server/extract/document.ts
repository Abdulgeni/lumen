import mammoth from "mammoth";
import { MAX_EXTRACTED_CHARS, normalizeText } from "./html";

export type FileExtraction =
  { kind: "text"; text: string; title: string } | { kind: "pdf"; bytes: Uint8Array };

export class FileExtractionError extends Error {
  constructor(
    readonly code: "UNSUPPORTED_FILE" | "EMPTY_FILE" | "CORRUPT_FILE",
    message: string,
  ) {
    super(message);
    this.name = "FileExtractionError";
  }
}

const startsWith = (bytes: Uint8Array, signature: string) =>
  [...signature].every((char, index) => bytes[index] === char.charCodeAt(0));

/**
 * Identifies the file by its content, never by the browser-reported MIME type.
 * PDFs are returned untouched so Gemini can read them natively, including scans.
 */
export async function extractFromFile(file: {
  name: string;
  bytes: Uint8Array;
}): Promise<FileExtraction> {
  if (file.bytes.byteLength === 0)
    throw new FileExtractionError("EMPTY_FILE", "That file is empty.");

  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const title = file.name.replace(/\.[^.]+$/, "") || "Uploaded document";

  if (startsWith(file.bytes, "%PDF-")) return { kind: "pdf", bytes: file.bytes };

  if (startsWith(file.bytes, "PK\x03\x04")) {
    if (extension !== "docx") {
      throw new FileExtractionError(
        "UNSUPPORTED_FILE",
        "Only PDF, DOCX, TXT and MD files are supported.",
      );
    }
    try {
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(file.bytes) });
      const text = normalizeText(value).slice(0, MAX_EXTRACTED_CHARS);
      if (!text)
        throw new FileExtractionError("EMPTY_FILE", "We could not find any text in that document.");
      return { kind: "text", text, title };
    } catch (error) {
      if (error instanceof FileExtractionError) throw error;
      throw new FileExtractionError("CORRUPT_FILE", "We could not read that DOCX file.");
    }
  }

  if (["txt", "md", "markdown"].includes(extension) && !file.bytes.includes(0)) {
    try {
      const text = normalizeText(
        new TextDecoder("utf-8", { fatal: true }).decode(file.bytes),
      ).slice(0, MAX_EXTRACTED_CHARS);
      if (!text) throw new FileExtractionError("EMPTY_FILE", "That file is empty.");
      return { kind: "text", text, title };
    } catch (error) {
      if (error instanceof FileExtractionError) throw error;
      throw new FileExtractionError("UNSUPPORTED_FILE", "Text files must be saved as UTF-8.");
    }
  }

  throw new FileExtractionError(
    "UNSUPPORTED_FILE",
    "Only PDF, DOCX, TXT and MD files are supported.",
  );
}
