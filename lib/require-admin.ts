import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { isAdminUser } from "@/lib/admin-auth";

export async function requireAdminSession() {
  const session = await getSessionFromCookies();
  if (!session) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { subscription: true },
  });
  if (!user || !isAdminUser(user)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null };
}
