import Stripe from "stripe";
import { isStripeCheckoutConfigured } from "@/lib/integrations";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeCheckoutConfigured()) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeSingleton;
}

export function priceIdForPlan(
  plan: "MONTHLY" | "ANNUAL" | "ANNUAL_CRYPTO",
): string | null {
  if (plan === "MONTHLY") return process.env.STRIPE_PRICE_MONTHLY ?? null;
  if (plan === "ANNUAL") return process.env.STRIPE_PRICE_ANNUAL ?? null;
  return null;
}
