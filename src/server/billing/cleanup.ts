import Stripe from "stripe";
import { db } from "../db";
import { getStripe } from "./stripe";

/**
 * Deleting a Stripe customer immediately cancels its subscriptions. If Stripe fails we throw,
 * which aborts the account deletion, so nobody is left billed with no account.
 */
export async function removeStripeCustomer(userId: string): Promise<void> {
  const row = await db.billingCustomer.findUnique({ where: { userId } });
  if (!row) return;
  try {
    await getStripe().customers.del(row.stripeCustomerId);
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeInvalidRequestError &&
      error.code === "resource_missing"
    ) {
      return;
    }
    throw error;
  }
}
