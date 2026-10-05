import Stripe from "stripe";
import { env } from "../../env";
import { ApiFailure } from "../api/failure";

let client: Stripe | undefined;

/** The SDK pins its own API version, so no version string is hardcoded here. */
export const getStripe = () =>
  (client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    timeout: 15_000,
    appInfo: { name: "Lumen" },
  }));

/** Turns Stripe failures into a safe, generic response. Details go to the log, never to the client. */
export async function withStripeErrors<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ApiFailure) throw error;
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[stripe] api error:", error.type, error.code);
      throw new ApiFailure(
        502,
        "BILLING_UNAVAILABLE",
        "Billing is temporarily unavailable. Please try again.",
      );
    }
    throw error;
  }
}
