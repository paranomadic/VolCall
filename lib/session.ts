import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import {
  getJwtSecretForSigning,
  getJwtSecretForVerify,
} from "@/lib/jwt-secret";

const COOKIE = "volcall_session";
const TTL_SEC = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  email: string;
};

export async function createSessionToken(user: Pick<User, "id" | "email">) {
  return new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SEC}s`)
    .sign(getJwtSecretForSigning());
}

export async function readSessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretForVerify());
    const sub = payload.sub;
    const email = payload.email;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    return { sub, email };
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: TTL_SEC,
};

/** Prefer this from Route Handlers — `cookies().set` alone often omits Set-Cookie on the response. */
export function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE, token, cookieOptions);
}

export function clearSessionOnResponse(response: NextResponse) {
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

/** @deprecated Use applySessionCookie on NextResponse from Route Handlers */
export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, cookieOptions);
}

/** @deprecated Use clearSessionOnResponse */
export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}
