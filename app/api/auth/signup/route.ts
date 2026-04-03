import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password, tcpaConsent } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      tcpaConsent,
      emailVerified: false,
      subscription: {
        create: {
          state: "PENDING",
          plan: "MONTHLY",
          onboardingStep: 0,
        },
      },
    },
  });

  const token = await createSessionToken(user);
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    userId: user.id,
    message:
      "Check your inbox for a verification link. (Demo: use /api/auth/verify-demo to verify.)",
  });
}
