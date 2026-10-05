import Stripe from "stripe";
import { PLAN_PRICE_USD } from "../src/lib/billing";

const PLANS = [
  { lookupKey: "lumen_pro_monthly", name: "Lumen Pro", unitAmount: PLAN_PRICE_USD.pro * 100 },
  { lookupKey: "lumen_team_monthly", name: "Lumen Team", unitAmount: PLAN_PRICE_USD.team * 100 },
] as const;

async function main() {
  const live = process.argv.includes("--live");
  const key = process.env.STRIPE_SECRET_KEY;
  const allowed = key?.startsWith("sk_test_") || (live && key?.startsWith("sk_live_"));
  if (!key || !allowed) {
    throw new Error(
      "Refusing to run: use a test key, or a live key together with the --live flag.",
    );
  }
  const stripe = new Stripe(key);

  for (const plan of PLANS) {
    const existing = await stripe.prices.list({
      lookup_keys: [plan.lookupKey],
      active: true,
      limit: 1,
    });
    if (existing.data[0]) {
      console.log(`exists   ${plan.lookupKey} -> ${existing.data[0].id}`);
      continue;
    }
    const product = await stripe.products.create({
      name: plan.name,
      metadata: { app: "lumen" },
    });
    const price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: plan.unitAmount,
      recurring: { interval: "month" },
      lookup_key: plan.lookupKey,
    });
    console.log(`created  ${plan.lookupKey} -> ${price.id} ($${plan.unitAmount / 100}/month)`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
