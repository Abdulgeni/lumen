import { makePreview } from "../src/lib/text";
import { countWords } from "../src/lib/words";
import { db } from "../src/server/db";

const MARKER = "demo-seed";
const TOPICS = [
  "Quarterly revenue review",
  "Supply chain risk assessment",
  "Hiring plan for next year",
  "Customer interview findings",
  "Competitor pricing changes",
  "Security audit results",
  "Product roadmap update",
  "Board meeting minutes",
];
const MODES = ["EXECUTIVE_BRIEF", "KEY_POINTS", "DEEP_DIVE"] as const;

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email) throw new Error("Usage: npm run seed:demo -- <email> [--remove]");
  console.log("Database host:", new URL(process.env.DATABASE_URL ?? "postgres://missing").hostname);

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("No user with that email.");

  if (flag === "--remove") {
    const { count } = await db.summary.deleteMany({
      where: { userId: user.id, sourceName: MARKER },
    });
    console.log(`Removed ${count} demo summaries.`);
    return;
  }

  const rows = Array.from({ length: 25 }, (_, i) => {
    const topic = TOPICS[i % TOPICS.length] ?? "Report";
    const mode = MODES[i % MODES.length] ?? "KEY_POINTS";
    const body = `## Bottom line\nThis sample covers ${topic.toLowerCase()} number ${i + 1}, with 100% sample data.\n\n## Key facts\n- Growth held steady across the period\n- Costs rose modestly\n- Two risks need follow-up\n\n## Implications\nReview the open risks before the next meeting.`;
    return {
      userId: user.id,
      title: `${topic} — Q${(i % 4) + 1}`,
      sourceType: i % 2 === 0 ? ("TEXT" as const) : ("URL" as const),
      sourceUrl: i % 2 === 0 ? null : `https://example.com/report-${i + 1}`,
      sourceName: MARKER,
      mode,
      length: "MEDIUM" as const,
      tone: "PROFESSIONAL" as const,
      status: "COMPLETED" as const,
      resultMarkdown: body,
      preview: makePreview(body),
      aiModel: "demo",
      inputWords: 1200 + ((i * 379) % 4800),
      outputWords: countWords(body),
      isFavorite: i % 7 === 0,
      createdAt: new Date(Date.now() - i * 9 * 3_600_000),
    };
  });
  await db.summary.createMany({ data: rows });
  console.log(
    `Added ${rows.length} demo summaries. Remove them with: npm run seed:demo -- ${email} --remove`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
