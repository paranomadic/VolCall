import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const row = await prisma.emailVerificationToken.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!row) {
    redirect("/login?verify=invalid");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?verify=ok");
}
