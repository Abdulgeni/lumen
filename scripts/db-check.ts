import { db } from "../src/server/db";

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  console.log("Connected host:", host);

  const [info] = await db.$queryRaw<{ now: Date; version: string }[]>`
    select now() as now, version() as version`;
  console.log(info);

  const tables = await db.$queryRaw<{ table_name: string }[]>`
  select table_name::text from information_schema.tables
  where table_schema = 'public' order by table_name`;
  console.log(tables.map((t) => t.table_name).join(", "));

  // Foreign keys and cascade delete.
  const id = `check_${Date.now()}`;
  await db.user.create({ data: { id, name: "Check", email: `${id}@example.com` } });
  await db.summary.create({
    data: {
      userId: id,
      title: "t",
      sourceType: "TEXT",
      mode: "KEY_POINTS",
      length: "SHORT",
      tone: "NEUTRAL",
    },
  });
  await db.user.delete({ where: { id } });
  console.log(
    "Summaries left after user delete (expect 0):",
    await db.summary.count({ where: { userId: id } }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
