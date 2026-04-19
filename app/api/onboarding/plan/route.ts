import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { isLemonSqueezyConfigured } from "@/lib/integrations";

const schema = z.object({
  plan: z.enum(["MONTHLY", "ANNUAL", "ANNUAL_CRYPTO"]),
});

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.sub },
  });
  if (!sub || sub.onboardingStep < 1) {
    return NextResponse.json(
      { error: "Complete the previous step first." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const renewal = new Date();
  if (parsed.data.plan === "MONTHLY") {
    renewal.setMonth(renewal.getMonth() + 1);
  } else {
    renewal.setFullYear(renewal.getFullYear() + 1);
  }

  await prisma.subscription.update({
    where: { userId: session.sub },
    data: {
      plan: parsed.data.plan,
      renewalAt: renewal,
      onboardingStep: 2,
      paymentMethodLabel:
        parsed.data.plan === "ANNUAL_CRYPTO"
          ? "USDC (pending)"
          : isLemonSqueezyConfigured()
            ? "Card (Lemon Squeezy — demo)"
            : "Card (Stripe Checkout — demo)",
    },
  });

  return NextResponse.json({ ok: true });
}
