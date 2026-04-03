import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";

const schema = z.object({
  smsFallback: z.boolean().optional(),
  summaryEmailOptIn: z.boolean().optional(),
});

export async function PATCH(request: Request) {
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

  await prisma.user.update({
    where: { id: session.sub },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
