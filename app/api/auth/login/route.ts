import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  applySessionCookie,
  createSessionToken,
} from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = await createSessionToken(user);
    const res = NextResponse.json({ ok: true, userId: user.id });
    applySessionCookie(res, token);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error("[auth/login]", e);
    return NextResponse.json(
      {
        error:
          msg.includes("JWT_SECRET") || msg.includes("Prisma")
            ? "Server misconfiguration or database error. Check DATABASE_URL and JWT_SECRET."
            : "Something went wrong. Try again.",
      },
      { status: 500 },
    );
  }
}
