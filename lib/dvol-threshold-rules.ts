import type { SystemSettings } from "@prisma/client";

/** PRD §6.2 style defaults — must satisfy elevated < high < critical for each asset. */
export const PRD_DVOL_THRESHOLDS = {
  btc: { elevated: 50, high: 70, critical: 90 },
  eth: { elevated: 60, high: 80, critical: 100 },
} as const;

/** If stored values are unordered, fall back to PRD defaults so bands stay interpretable. */
export function effectiveBtcThresholds(s: SystemSettings) {
  const elevated = s.btcElevated;
  const high = s.btcHigh;
  const critical = s.btcCritical;
  if (elevated < high && high < critical) {
    return { elevated, high, critical };
  }
  return { ...PRD_DVOL_THRESHOLDS.btc };
}

export function effectiveEthThresholds(s: SystemSettings) {
  const elevated = s.ethElevated;
  const high = s.ethHigh;
  const critical = s.ethCritical;
  if (elevated < high && high < critical) {
    return { elevated, high, critical };
  }
  return { ...PRD_DVOL_THRESHOLDS.eth };
}

/** Returns an error message if bands are unordered (classification becomes misleading). */
export function validateDvolThresholdOrder(
  elevated: number,
  high: number,
  critical: number,
  assetLabel: string,
): string | null {
  if (!(elevated < high && high < critical)) {
    return `${assetLabel}: need elevated < high < critical (you have ${elevated}, ${high}, ${critical}). Save fails — fix in Admin or click “Reset to PRD defaults”.`;
  }
  return null;
}
