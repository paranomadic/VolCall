import { NextResponse } from "next/server";
import { fetchDvol } from "@/lib/deribit";
import { shouldAlert } from "@/lib/thresholds";
import { classifyForAssetFromSettings } from "@/lib/thresholds-configurable";
import { getEngineSettings } from "@/lib/engine-settings";
import { requireAdminSession } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const t0 = Date.now();
  const settings = await getEngineSettings();
  const assets = ["BTC", "ETH"] as const;
  const rows: {
    asset: string;
    dvol: number | null;
    error?: string;
    band?: string;
    wouldAlert?: boolean;
  }[] = [];

  for (const asset of assets) {
    try {
      const dvol = await fetchDvol(asset);
      if (dvol == null) {
        rows.push({ asset, dvol: null, error: "No data from Deribit" });
        continue;
      }
      const band = classifyForAssetFromSettings(asset, dvol, settings);
      rows.push({
        asset,
        dvol,
        band,
        wouldAlert: shouldAlert(band),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      rows.push({ asset, dvol: null, error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    latencyMs: Date.now() - t0,
    source: "deribit public/get_volatility_index_data (1h)",
    readings: rows,
  });
}
