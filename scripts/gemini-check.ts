import { generateSummaryStream } from "../src/server/ai/gemini";
import { buildSummaryPrompt, splitTitle } from "../src/server/ai/prompt";

const SAMPLE = `Harbor Lane Coffee opened its fourth location this quarter and reported revenue of 2.4 million dollars,
up 18 percent from the previous quarter. Most of the growth came from the new wholesale program, which now supplies
31 local offices. Costs rose 11 percent, mainly because green coffee prices climbed and the company hired six
baristas. The founders plan to open a roasting facility next spring, funded by a 600,000 dollar loan, and expect
wholesale to exceed retail sales by the end of next year. Management flagged supplier concentration as the main
risk: one importer provides 70 percent of its beans.`;

const runs = [
  { tier: "lite", mode: "EXECUTIVE_BRIEF", language: "en" },
  { tier: "standard", mode: "EXECUTIVE_BRIEF", language: "en" },
  { tier: "standard", mode: "KEY_POINTS", language: "es" },
] as const;

async function main() {
  for (const run of runs) {
    const { systemInstruction, userContent } = buildSummaryPrompt({
      mode: run.mode,
      length: "SHORT",
      tone: "PROFESSIONAL",
      language: run.language,
      source: { type: "TEXT" },
      text: SAMPLE,
    });

    const started = Date.now();
    let text = "";
    let model = "";
    let tokens = "";
    for await (const event of generateSummaryStream({
      tier: run.tier,
      systemInstruction,
      userContent,
    })) {
      if (event.type === "text") text += event.text;
      else {
        model = event.model;
        tokens = `in=${event.inputTokens} out=${event.outputTokens} finish=${event.finishReason}`;
      }
    }
    const { title, body } = splitTitle(text);
    console.log(
      `\n=== ${run.tier} / ${run.mode} / ${run.language} → ${model} (${Date.now() - started} ms, ${tokens})`,
    );
    console.log(`TITLE: ${title}\n${body}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});