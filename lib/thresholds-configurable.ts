import type { SystemSettings } from "@prisma/client";

import type { VolBand } from "@/lib/thresholds";
import {
  effectiveBtcThresholds,
  effectiveEthThresholds,
} from "@/lib/dvol-threshold-rules";

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
    const t = effectiveBtcThresholds(s);
    return classifyDvolBand(dvol, t.elevated, t.high, t.critical);
  }
  if (asset === "ETH") {
    const t = effectiveEthThresholds(s);
    return classifyDvolBand(dvol, t.elevated, t.high, t.critical);
  }
  return "none";
}
