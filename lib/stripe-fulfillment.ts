import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe-server";

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.mode !== "subscription") return;
  if (session.payment_status !== "paid") return;

  const userId = session.metadata?.userId ?? session.client_reference_id;
  if (!userId) return;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  await prisma.subscription.update({
    where: { userId },
    data: {
      onboardingStep: 3,
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subId ?? undefined,
      paymentMethodLabel: "Card (Stripe)",
    },
  });
}

export async function fulfillCheckoutSessionById(
  sessionId: string,
): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  await fulfillCheckoutSession(session);
  return session.payment_status === "paid";
}
