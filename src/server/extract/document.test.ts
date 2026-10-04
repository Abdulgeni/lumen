import { describe, expect, it } from "vitest";
import { extractFromFile } from "./document";

const bytes = (text: string) => new TextEncoder().encode(text);

describe("extractFromFile", () => {
  it("passes PDFs through untouched, identified by content", async () => {
    const result = await extractFromFile({
      name: "report.pdf",
      bytes: bytes("%PDF-1.7 rest of file"),
    });
    expect(result.kind).toBe("pdf");
  });

  it("identifies a PDF even when it is misnamed", async () => {
    const result = await extractFromFile({ name: "report.txt", bytes: bytes("%PDF-1.4 data") });
    expect(result.kind).toBe("pdf");
  });

  it("reads UTF-8 text and markdown, titling from the file name", async () => {
    const result = await extractFromFile({
      name: "notes.md",
      bytes: bytes("# Heading\n\nSome notes."),
    });
    expect(result).toEqual({ kind: "text", text: "# Heading\n\nSome notes.", title: "notes" });
  });

  it("rejects empty files", async () => {
    await expect(extractFromFile({ name: "a.txt", bytes: new Uint8Array() })).rejects.toMatchObject(
      {
        code: "EMPTY_FILE",
      },
    );
  });

  it("rejects binary data posing as text", async () => {
    await expect(
      extractFromFile({ name: "a.txt", bytes: new Uint8Array([0x68, 0x00, 0x69]) }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_FILE" });
  });

  it("rejects unsupported types and non-DOCX archives", async () => {
    await expect(extractFromFile({ name: "run.exe", bytes: bytes("MZ...") })).rejects.toMatchObject(
      {
        code: "UNSUPPORTED_FILE",
      },
    );
    await expect(
      extractFromFile({ name: "archive.txt", bytes: bytes("PK\x03\x04data") }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_FILE" });
  });

  it("reports a corrupt DOCX", async () => {
    await expect(
      extractFromFile({ name: "broken.docx", bytes: bytes("PK\x03\x04garbage") }),
    ).rejects.toMatchObject({ code: "CORRUPT_FILE" });
  });
});
