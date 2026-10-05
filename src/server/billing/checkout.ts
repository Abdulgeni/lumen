import { PRICE_LOOKUP_KEYS, type PaidPlanId } from "@/lib/billing";
import { env } from "../../env";
import { ApiFailure } from "../api/failure";
import { db } from "../db";
import { getEntitlement } from "../entitlements";
import { getStripe, withStripeErrors } from "./stripe";

const priceCache = new Map<string, { id: string; expires: number }>();

async function priceIdFor(plan: PaidPlanId): Promise<string> {
  const key = PRICE_LOOKUP_KEYS[plan];
  const cached = priceCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.id;

  const { data } = await getStripe().prices.list({ lookup_keys: [key], active: true, limit: 1 });
  const price = data[0];
  if (!price) throw new ApiFailure(503, "BILLING_NOT_CONFIGURED", "Billing is not available yet.");
  priceCache.set(key, { id: price.id, expires: Date.now() + 5 * 60_000 });
  return price.id;
}

/** One Stripe customer per user. The idempotency key makes double-clicks harmless. */
async function ensureCustomer(user: { id: string; email: string; name: string }): Promise<string> {
  const existing = await db.billingCustomer.findUnique({ where: { userId: user.id } });
  if (existing) return existing.stripeCustomerId;

  const customer = await getStripe().customers.create(
    { email: user.email, name: user.name, metadata: { userId: user.id } },
    { idempotencyKey: `lumen-customer-${user.id}` },
  );
  await db.billingCustomer.createMany({
    data: [{ userId: user.id, stripeCustomerId: customer.id }],
    skipDuplicates: true,
  });
  const row = await db.billingCustomer.findUniqueOrThrow({ where: { userId: user.id } });
  return row.stripeCustomerId;
}

export function createCheckoutSession(input: {
  user: { id: string; email: string; name: string };
  plan: PaidPlanId;
}): Promise<string> {
  return withStripeErrors(async () => {
    const current = await getEntitlement(input.user.id);
    if (current.planId !== "free") {
      throw new ApiFailure(
        409,
        "ALREADY_SUBSCRIBED",
        "You already have a paid plan. Use Manage billing to change it.",
      );
    }

    const [customer, price] = await Promise.all([
      ensureCustomer(input.user),
      priceIdFor(input.plan),
    ]);
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: input.user.id,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: input.user.id, plan: input.plan } },
      // Redirect targets come from our own config, never from the request.
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=cancelled`,
    });
    if (!session.url) {
      throw new ApiFailure(
        502,
        "BILLING_UNAVAILABLE",
        "Billing is temporarily unavailable. Please try again.",
      );
    }
    return session.url;
  });
}

export function createPortalSession(userId: string): Promise<string> {
  return withStripeErrors(async () => {
    const row = await db.billingCustomer.findUnique({ where: { userId } });
    if (!row) {
      throw new ApiFailure(
        409,
        "NO_BILLING_ACCOUNT",
        "You do not have a subscription to manage yet.",
      );
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: row.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });
    return session.url;
  });
}
