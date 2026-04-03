import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { sendVerificationCode } from "@/lib/twilio-verify";
import { isTwilioVerifyConfigured } from "@/lib/integrations";
import { enforceEmailVerification } from "@/lib/email-enforcement";

const schema = z.object({
  e164: z.string().min(8).max(20),
});

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (enforceEmailVerification()) {
    const u = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!u?.emailVerified) {
      return NextResponse.json(
        { error: "Verify your email before requesting an SMS code." },
        { status: 400 },
      );
    }
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (!isTwilioVerifyConfigured()) {
    return NextResponse.json(
      {
        mode: "demo",
        message: "Twilio not configured — use OTP 000000.",
      },
      { status: 200 },
    );
  }

  const res = await sendVerificationCode(parsed.data.e164);
  if (!res.ok) {
    return NextResponse.json({ error: res.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, mode: "twilio" });
}
