import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  isLemonSqueezyConfigured,
  isStripeCheckoutConfigured,
} from "@/lib/integrations";
import { createHostedCheckoutForUserId } from "@/lib/hosted-checkout";
import { requireAdminSession } from "@/lib/require-admin";

const bodySchema = z.object({
  email: z.string().email(),
  action: z.enum(["status", "simulate_checkout", "hosted_checkout"]),
});

export async function POST(request: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim();
  const target = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { subscription: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const sub = target.subscription;
  if (!sub) {
    return NextResponse.json(
      { error: "User has no subscription row." },
      { status: 400 },
    );
  }

  const lemon = isLemonSqueezyConfigured();
  const stripe = isStripeCheckoutConfigured();
  const primary = lemon ? "lemonsqueezy" : stripe ? "stripe" : "none";

  if (parsed.data.action === "status") {
    return NextResponse.json({
      ok: true,
      action: "status",
      userId: target.id,
      email: target.email,
      onboardingStep: sub.onboardingStep,
      plan: sub.plan,
      state: sub.state,
      paymentMethodLabel: sub.paymentMethodLabel,
      providers: {
        lemonSqueezyConfigured: lemon,
        stripeConfigured: stripe,
        hostedPrimary: primary,
      },
      hints: {
        simulate:
          sub.onboardingStep >= 2
            ? "Eligible for simulate_checkout (sets onboarding step 3)."
            : "Need onboardingStep ≥ 2 (complete phone + plan in onboarding).",
        hosted:
          sub.onboardingStep >= 2 && sub.plan !== "ANNUAL_CRYPTO" && primary !== "none"
            ? "Eligible for hosted_checkout URL."
            : primary === "none"
              ? "Configure Lemon Squeezy or Stripe in env."
              : sub.plan === "ANNUAL_CRYPTO"
                ? "Use simulate checkout for USDC path."
                : "Complete plan step first.",
      },
    });
  }

  if (parsed.data.action === "simulate_checkout") {
    if (sub.onboardingStep < 2) {
      return NextResponse.json(
        {
          error:
            "User must be at payment step (onboardingStep ≥ 2). Use onboarding or grant + plan update.",
        },
        { status: 400 },
      );
    }
    await prisma.subscription.update({
      where: { userId: target.id },
      data: { onboardingStep: 3 },
    });
    return NextResponse.json({
      ok: true,
      action: "simulate_checkout",
      message:
        "Set onboardingStep to 3 (same as in-app “simulate successful checkout”). Continue at /onboarding/4.",
      userId: target.id,
      onboardingStep: 3,
    });
  }

  const checkout = await createHostedCheckoutForUserId(target.id);
  if (!checkout.ok) {
    return NextResponse.json(
      { error: checkout.error, action: "hosted_checkout" },
      { status: checkout.status },
    );
  }

  return NextResponse.json({
    ok: true,
    action: "hosted_checkout",
    url: checkout.url,
    provider: checkout.provider,
    userId: target.id,
    hint: "Open `url` in a browser (logged-in user should match this account).",
  });
}
