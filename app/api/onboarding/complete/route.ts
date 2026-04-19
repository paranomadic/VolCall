import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";

export async function POST() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.sub },
  });
  if (!sub || sub.onboardingStep < 3) {
    return NextResponse.json(
      { error: "Complete payment step first." },
      { status: 400 },
    );
  }

  const assets = ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE"];
  await prisma.$transaction([
    prisma.subscription.update({
      where: { userId: session.sub },
      data: {
        state: "ACTIVE",
        onboardingStep: 4,
        paymentMethodLabel:
          sub.paymentMethodLabel?.replace(/USDC \(pending\)/, "USDC") ??
          "Card",
      },
    }),
    ...assets.map((asset) =>
      prisma.alertPreference.upsert({
        where: {
          userId_asset: { userId: session.sub, asset },
        },
        create: { userId: session.sub, asset, enabled: true },
        update: {},
      }),
    ),
    prisma.callEvent.create({
      data: {
        userId: session.sub,
        asset: "BTC",
        trigger: "BTC DVOL crossed 90 (critical)",
        durationSec: 42,
        answered: true,
      },
    }),
    prisma.callEvent.create({
      data: {
        userId: session.sub,
        asset: "ETH",
        trigger: "ETH DVOL crossed 80 (high)",
        durationSec: 0,
        answered: false,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
