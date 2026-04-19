import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const bodySchema = z.object({
  email: z.string().email(),
});

const ONBOARD_ASSETS = ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE"] as const;

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
  if (!target.subscription) {
    return NextResponse.json(
      { error: "User has no subscription row." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { userId: target.id },
      data: {
        state: "ACTIVE",
        onboardingStep: 4,
        paymentMethodLabel: "Comp (admin)",
      },
    }),
    ...ONBOARD_ASSETS.map((asset) =>
      prisma.alertPreference.upsert({
        where: {
          userId_asset: { userId: target.id, asset },
        },
        create: { userId: target.id, asset, enabled: true },
        update: { enabled: true },
      }),
    ),
  ]);

  return NextResponse.json({
    ok: true,
    userId: target.id,
    email: target.email,
  });
}
