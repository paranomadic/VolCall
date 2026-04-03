import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  dndStartMin: z.number().int().min(0).max(1439).nullable().optional(),
  dndEndMin: z.number().int().min(0).max(1439).nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const phone = await prisma.phoneNumber.findFirst({
    where: { id, userId: session.sub },
  });
  if (!phone) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await prisma.phoneNumber.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const phone = await prisma.phoneNumber.findFirst({
    where: { id, userId: session.sub },
  });
  if (!phone) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.phoneNumber.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
