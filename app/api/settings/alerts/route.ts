import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";

const patchSchema = z.object({
  asset: z.string(),
  enabled: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { asset, enabled } = parsed.data;
  await prisma.alertPreference.upsert({
    where: {
      userId_asset: { userId: session.sub, asset },
    },
    create: {
      userId: session.sub,
      asset,
      enabled: enabled ?? true,
    },
    update: { enabled: enabled ?? true },
  });

  return NextResponse.json({ ok: true });
}
