import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";

/** Simulates Stripe Checkout success. Production: webhook sets state. */
export async function POST() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.sub },
  });
  if (!sub || sub.onboardingStep < 2) {
    return NextResponse.json(
      { error: "Complete plan selection first." },
      { status: 400 },
    );
  }

  await prisma.subscription.update({
    where: { userId: session.sub },
    data: { onboardingStep: 3 },
  });

  return NextResponse.json({ ok: true });
}
