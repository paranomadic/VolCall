import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { PRD_DVOL_THRESHOLDS } from "@/lib/dvol-threshold-rules";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const data = {
    btcElevated: PRD_DVOL_THRESHOLDS.btc.elevated,
    btcHigh: PRD_DVOL_THRESHOLDS.btc.high,
    btcCritical: PRD_DVOL_THRESHOLDS.btc.critical,
    ethElevated: PRD_DVOL_THRESHOLDS.eth.elevated,
    ethHigh: PRD_DVOL_THRESHOLDS.eth.high,
    ethCritical: PRD_DVOL_THRESHOLDS.eth.critical,
  };

  const row = await prisma.systemSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, settings: row });
}
