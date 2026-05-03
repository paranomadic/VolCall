import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import {
  isLemonSqueezyConfigured,
  isStripeCheckoutConfigured,
  isTwilioVoiceConfigured,
  isVapiVoiceConfigured,
} from "@/lib/integrations";

const patchSchema = z.object({
  btcElevated: z.number().finite(),
  btcHigh: z.number().finite(),
  btcCritical: z.number().finite(),
  ethElevated: z.number().finite(),
  ethHigh: z.number().finite(),
  ethCritical: z.number().finite(),
});

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const row = await prisma.systemSettings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });

  return NextResponse.json({
    settings: row,
    voice: {
      vapiConfigured: isVapiVoiceConfigured(),
      twilioVoiceConfigured: isTwilioVoiceConfigured(),
    },
    payments: {
      lemonSqueezyConfigured: isLemonSqueezyConfigured(),
      stripeConfigured: isStripeCheckoutConfigured(),
    },
  });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const row = await prisma.systemSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ settings: row });
}
