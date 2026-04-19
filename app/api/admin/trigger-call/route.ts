import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fetchDvol } from "@/lib/deribit";
import { shouldAlert } from "@/lib/thresholds";
import { classifyForAssetFromSettings } from "@/lib/thresholds-configurable";
import { getEngineSettings } from "@/lib/engine-settings";
import { placeOutboundVoiceAlert } from "@/lib/voice-outbound";
import { requireAdminSession } from "@/lib/require-admin";

const bodySchema = z.object({
  email: z.string().email(),
  asset: z.enum(["BTC", "ETH"]),
  /** If set, used instead of live Deribit DVOL (for predictable tests). */
  dvolOverride: z.number().finite().optional(),
  /** If true, only writes a CallEvent — no Vapi/Twilio. */
  dryRun: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim();
  const target = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: {
      subscription: true,
      phoneNumbers: { where: { verified: true, enabled: true } },
    },
  });
  if (!target?.subscription) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const phone = target.phoneNumbers[0];
  if (!phone) {
    return NextResponse.json(
      { error: "No verified enabled phone for this user." },
      { status: 400 },
    );
  }

  const settings = await getEngineSettings();
  let dvol: number;
  if (parsed.data.dvolOverride != null) {
    dvol = parsed.data.dvolOverride;
  } else {
    const live = await fetchDvol(parsed.data.asset);
    if (live == null) {
      return NextResponse.json(
        { error: "Could not load DVOL from Deribit. Pass dvolOverride." },
        { status: 502 },
      );
    }
    dvol = live;
  }

  const band = classifyForAssetFromSettings(parsed.data.asset, dvol, settings);
  const trigger = `[admin test] ${parsed.data.asset} DVOL ${dvol.toFixed(1)} (${band})`;

  if (parsed.data.dryRun) {
    await prisma.callEvent.create({
      data: {
        userId: target.id,
        asset: parsed.data.asset,
        trigger: `${trigger} [dry-run]`,
        answered: false,
      },
    });
    return NextResponse.json({
      ok: true,
      dryRun: true,
      band,
      wouldAlert: shouldAlert(band),
      dvol,
      message:
        "Recorded a call event only. Use dryRun: false to place a real call (requires Vapi or Twilio).",
    });
  }

  const out = await placeOutboundVoiceAlert({
    e164: phone.e164,
    asset: parsed.data.asset,
    dvol,
    band,
  });

  if (!out.ok) {
    return NextResponse.json(
      {
        error: out.message,
        band,
        dvol,
        wouldAlert: shouldAlert(band),
      },
      { status: 502 },
    );
  }

  await prisma.callEvent.create({
    data: {
      userId: target.id,
      asset: parsed.data.asset,
      trigger,
      answered: false,
    },
  });

  return NextResponse.json({
    ok: true,
    channel: out.channel,
    id: out.id,
    band,
    dvol,
    wouldAlert: shouldAlert(band),
  });
}
