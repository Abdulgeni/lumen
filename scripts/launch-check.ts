import { LEGAL } from "../src/lib/legal";

type Check = { name: string; ok: boolean; detail?: string };
const env = process.env;

const unfilled = Object.entries(LEGAL)
  .filter(([, value]) => /^\[.*\]$/.test(value))
  .map(([key]) => key);

const checks: Check[] = [
  {
    name: "Legal placeholders filled in",
    ok: unfilled.length === 0,
    detail: unfilled.join(", "),
  },
  {
    name: "App URL is your own https domain",
    ok:
      Boolean(env.NEXT_PUBLIC_APP_URL?.startsWith("https://")) &&
      !/vercel\.app/i.test(env.NEXT_PUBLIC_APP_URL ?? ""),
    detail: env.NEXT_PUBLIC_APP_URL,
  },
  {
    name: "Stripe uses live keys",
    ok: env.STRIPE_SECRET_KEY?.startsWith("sk_live_") === true,
  },
  {
    name: "Email sends from your own domain",
    ok: Boolean(env.EMAIL_FROM) && !/resend\.dev/i.test(env.EMAIL_FROM ?? ""),
  },
  {
    name: "Support email is a real address",
    ok:
      Boolean(env.NEXT_PUBLIC_SUPPORT_EMAIL) &&
      !/@example\.(com|org)$/i.test(env.NEXT_PUBLIC_SUPPORT_EMAIL ?? ""),
  },
];

let failed = 0;
for (const check of checks) {
  console.log(
    `${check.ok ? "PASS" : "FAIL"}  ${check.name}${!check.ok && check.detail ? `  (${check.detail})` : ""}`,
  );
  if (!check.ok) failed += 1;
}

console.log(`
Cannot be checked by a script. Confirm each by hand:
  - Gemini key belongs to a billed project, with a budget alert set
  - Privacy Policy reviewed by a lawyer, and its AI-provider sentence matches your Gemini terms
  - Neon and Vercel plans are appropriate for commercial use (Vercel Hobby is for non-commercial use)
  - See docs/LAUNCH.md for the full list
`);
process.exit(failed === 0 ? 0 : 1);
