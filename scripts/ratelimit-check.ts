import { checkRateLimit } from "../src/server/rate-limit";

async function main() {
  const key = `check_${Date.now()}`;
  for (let i = 1; i <= 8; i++) {
    const result = await checkRateLimit(["summarizePerMinute"], key);
    console.log(
      `request ${i}:`,
      result.ok ? "allowed" : `blocked, retry in ${result.retryAfterSeconds}s`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});