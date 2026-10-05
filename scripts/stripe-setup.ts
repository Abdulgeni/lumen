import Stripe from "stripe";

const PLANS = [
  { lookupKey: "lumen_pro_monthly", name: "Lumen Pro", unitAmount: 1200 },
  { lookupKey: "lumen_team_monthly", name: "Lumen Team", unitAmount: 3900 },
] as const;

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) {
    throw new Error("Refusing to run: STRIPE_SECRET_KEY must be a test-mode key (sk_test_...).");
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
