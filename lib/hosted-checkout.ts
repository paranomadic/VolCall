import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/app-url";
import { getStripe, priceIdForPlan } from "@/lib/stripe-server";
import {
  isLemonSqueezyConfigured,
  isStripeCheckoutConfigured,
} from "@/lib/integrations";
import { createLemonCheckout, lemonVariantIdForPlan } from "@/lib/lemonsqueezy";

export type HostedCheckoutResult =
  | { ok: true; url: string; provider: "lemonsqueezy" | "stripe" }
  | { ok: false; error: string; status: number };

/** Shared by onboarding checkout and admin payment tests. */
export async function createHostedCheckoutForUserId(
  userId: string,
): Promise<HostedCheckoutResult> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!sub || sub.onboardingStep < 2) {
    return {
      ok: false,
      error: "Choose a plan before checkout.",
      status: 400,
    };
  }

  if (sub.plan === "ANNUAL_CRYPTO") {
    return {
      ok: false,
      error: "Use the simulated checkout path for USDC (Circle not wired).",
      status: 400,
    };
  }

  const base = getAppUrl();

  if (isLemonSqueezyConfigured()) {
    const variantId = lemonVariantIdForPlan(sub.plan);
    if (!variantId) {
      return {
        ok: false,
        error: "Missing Lemon Squeezy variant ID for this plan.",
        status: 500,
      };
    }
    const redirectUrl = `${base}/onboarding/3?ls=return`;
    const result = await createLemonCheckout({
      variantId,
      userId: sub.userId,
      email: sub.user.email,
      redirectUrl,
    });
    if ("error" in result) {
      return { ok: false, error: result.error, status: 502 };
    }
    return { ok: true, url: result.url, provider: "lemonsqueezy" };
  }

  if (!isStripeCheckoutConfigured()) {
    return {
      ok: false,
      error: "No payment provider is configured.",
      status: 503,
    };
  }

  const priceId = priceIdForPlan(sub.plan);
  if (!priceId) {
    return {
      ok: false,
      error: "Missing Stripe price ID.",
      status: 500,
    };
  }

  const stripe = getStripe()!;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: sub.user.email,
    client_reference_id: sub.userId,
    metadata: { userId: sub.userId },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/api/stripe/checkout-return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/onboarding/3`,
  });

  if (!checkout.url) {
    return {
      ok: false,
      error: "Could not start checkout.",
      status: 500,
    };
  }

  return { ok: true, url: checkout.url, provider: "stripe" };
}
