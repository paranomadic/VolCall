import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { getAppUrl } from "@/lib/app-url";
import { getStripe, priceIdForPlan } from "@/lib/stripe-server";
import { isStripeCheckoutConfigured } from "@/lib/integrations";

export async function POST() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.sub },
    include: { user: true },
  });
  if (!sub || sub.onboardingStep < 2) {
    return NextResponse.json(
      { error: "Choose a plan before checkout." },
      { status: 400 },
    );
  }

  if (sub.plan === "ANNUAL_CRYPTO") {
    return NextResponse.json(
      { error: "Use the simulated checkout path for USDC (Circle not wired)." },
      { status: 400 },
    );
  }

  const priceId = priceIdForPlan(sub.plan);
  if (!priceId) {
    return NextResponse.json({ error: "Missing Stripe price ID." }, { status: 500 });
  }

  const stripe = getStripe()!;
  const base = getAppUrl();

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
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: checkout.url });
}
