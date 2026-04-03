import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      tcpaConsent: true,
      smsFallback: true,
      summaryEmailOptIn: true,
      createdAt: true,
      updatedAt: true,
      subscription: true,
      phoneNumbers: { orderBy: { createdAt: "asc" } },
      callEvents: { orderBy: { occurredAt: "desc" }, take: 50 },
      alertPrefs: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
