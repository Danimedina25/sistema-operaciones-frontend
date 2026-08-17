export interface ConcentrationEntry {
  id: number | string;
  amount: number;
}

export interface ConcentrationResult {
  totalAmount: number;
  topEntryPercent: number;
  topThreePercent: number;
}

/**
 * Calcula el porcentaje del volumen total concentrado en el principal
 * elemento (socio/cliente) y en los tres principales.
 */
export function calculateConcentration(entries: ConcentrationEntry[]): ConcentrationResult {
  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

  if (totalAmount === 0 || entries.length === 0) {
    return { totalAmount: 0, topEntryPercent: 0, topThreePercent: 0 };
  }

  const sorted = [...entries].sort((a, b) => b.amount - a.amount);

  const topEntryAmount = sorted[0]?.amount ?? 0;
  const topThreeAmount = sorted.slice(0, 3).reduce((sum, entry) => sum + entry.amount, 0);

  return {
    totalAmount,
    topEntryPercent: (topEntryAmount / totalAmount) * 100,
    topThreePercent: (topThreeAmount / totalAmount) * 100,
  };
}

export function isAboveConcentrationThreshold(
  result: ConcentrationResult,
  thresholdPercent: number,
): boolean {
  return result.topEntryPercent >= thresholdPercent;
}
