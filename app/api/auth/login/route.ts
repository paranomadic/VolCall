import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authRouteErrorResponse } from "@/lib/auth-route-errors";
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
    return authRouteErrorResponse(e, "auth/login");
  }
}
