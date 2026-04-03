import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { signupSchema } from "@/lib/validation";
import { isResendConfigured } from "@/lib/integrations";

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
  const verificationToken = randomBytes(32).toString("hex");
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
      emailVerificationTokens: {
        create: {
          token: verificationToken,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      },
    },
  });

  const token = await createSessionToken(user);
  await setSessionCookie(token);

  let message =
    "Account created. You can verify email from the onboarding step, or use the demo verifier if Resend is not configured.";
  if (isResendConfigured()) {
    const sent = await sendVerificationEmail({
      to: email,
      token: verificationToken,
    });
    message = sent.ok
      ? "Check your inbox for a verification link."
      : `We could not send email (${sent.reason}). Use “Mark email verified (demo)” or fix Resend.`;
  }

  return NextResponse.json({
    ok: true,
    userId: user.id,
    message,
  });
}
