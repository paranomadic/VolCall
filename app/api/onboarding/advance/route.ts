import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { enforceEmailVerification } from "@/lib/email-enforcement";

const schema = z.object({
  fromStep: z.number().int().min(1).max(4),
});

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { subscription: true },
  });
  if (!user?.subscription) {
    return NextResponse.json({ error: "No subscription" }, { status: 400 });
  }
  const sub = user.subscription;

  const { fromStep } = parsed.data;

  if (fromStep === 1) {
    if (enforceEmailVerification() && !user.emailVerified) {
      return NextResponse.json(
        {
          error:
            "Verify your email before adding phones when email delivery is enabled.",
        },
        { status: 400 },
      );
    }
    if (sub.onboardingStep !== 0) {
      return NextResponse.json(
        { error: "Invalid step progression." },
        { status: 400 },
      );
    }
    const n = await prisma.phoneNumber.count({
      where: { userId: session.sub, verified: true },
    });
    if (n < 1) {
      return NextResponse.json(
        { error: "Add at least one verified phone number." },
        { status: 400 },
      );
    }
    await prisma.subscription.update({
      where: { userId: session.sub },
      data: { onboardingStep: 1 },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Use specific endpoints for later steps." }, { status: 400 });
}
