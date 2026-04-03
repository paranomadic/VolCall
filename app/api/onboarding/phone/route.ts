import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";

const schema = z.object({
  e164: z.string().min(8).max(20),
  otp: z.string().length(6),
});

/** Twilio Verify is simulated: OTP `000000` always succeeds in development. */
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

  const { e164, otp } = parsed.data;
  if (otp !== "000000") {
    return NextResponse.json(
      {
        error:
          "Invalid or expired code. Demo build accepts 000000 only; production uses Twilio Verify.",
      },
      { status: 400 },
    );
  }

  const count = await prisma.phoneNumber.count({
    where: { userId: session.sub },
  });
  if (count >= 5) {
    return NextResponse.json(
      { error: "Maximum five numbers per account." },
      { status: 400 },
    );
  }

  await prisma.phoneNumber.create({
    data: {
      userId: session.sub,
      e164,
      verified: true,
      label: `Line ${count + 1}`,
    },
  });

  return NextResponse.json({ ok: true });
}
