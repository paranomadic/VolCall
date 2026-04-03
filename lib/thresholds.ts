/** PRD §6.2 default bands (simplified labels for engine). */
export type VolBand = "none" | "elevated" | "high" | "critical";

export function classifyBtcDvol(dvol: number): VolBand {
  if (dvol > 90) return "critical";
  if (dvol > 70) return "high";
  if (dvol >= 50) return "elevated";
  return "none";
}

export function classifyEthDvol(dvol: number): VolBand {
  if (dvol > 100) return "critical";
  if (dvol > 80) return "high";
  if (dvol >= 60) return "elevated";
  return "none";
}

export function classifyForAsset(
  asset: string,
  dvol: number,
): VolBand {
  if (asset === "BTC") return classifyBtcDvol(dvol);
  if (asset === "ETH") return classifyEthDvol(dvol);
  return "none";
}

/** True when a voice alert should fire (high + critical; PRD bundles). */
export function shouldAlert(band: VolBand): boolean {
  return band === "high" || band === "critical";
}
