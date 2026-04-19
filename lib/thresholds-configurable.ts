import type { SystemSettings } from "@prisma/client";

import type { VolBand } from "@/lib/thresholds";

export function classifyDvolBand(
  dvol: number,
  elevated: number,
  high: number,
  critical: number,
): VolBand {
  if (dvol > critical) return "critical";
  if (dvol > high) return "high";
  if (dvol >= elevated) return "elevated";
  return "none";
}

export function classifyForAssetFromSettings(
  asset: string,
  dvol: number,
  s: SystemSettings,
): VolBand {
  if (asset === "BTC") {
    return classifyDvolBand(
      dvol,
      s.btcElevated,
      s.btcHigh,
      s.btcCritical,
    );
  }
  if (asset === "ETH") {
    return classifyDvolBand(
      dvol,
      s.ethElevated,
      s.ethHigh,
      s.ethCritical,
    );
  }
  return "none";
}
