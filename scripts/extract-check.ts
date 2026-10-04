import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { countWords } from "../src/lib/words";
import { extractFromFile } from "../src/server/extract/document";
import { extractArticle } from "../src/server/extract/html";
import { decodeBody, safeFetch } from "../src/server/net/safe-fetch";

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: npm run extract:check -- <url or file path>");
    process.exit(1);
  }

  try {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) && !/^[a-z]:[\\/]/i.test(target)) {
      const page = await safeFetch(target);
      const { title, text } = extractArticle(decodeBody(page.bytes, page.contentType));
      console.log(
        `OK  ${page.url}\n    title: ${title}\n    ${text.length} chars, ${countWords(text)} words\n    ${text.slice(0, 300).replace(/\s+/g, " ")}`,
      );
    } else {
      const bytes = new Uint8Array(await readFile(target));
      const result = await extractFromFile({ name: basename(target), bytes });
      if (result.kind === "pdf") {
        console.log(`OK  PDF, ${result.bytes.byteLength} bytes (sent to Gemini as-is)`);
      } else {
        console.log(
          `OK  "${result.title}": ${result.text.length} chars, ${countWords(result.text)} words\n    ${result.text.slice(0, 300).replace(/\s+/g, " ")}`,
        );
      }
    }
  } catch (error) {
    const e = error as { code?: string; message?: string };
    console.log(`BLOCKED/ERROR  code=${e.code ?? "unknown"}  message=${e.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});