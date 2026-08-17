export interface PeriodComparison {
  current: number;
  previous: number;
  absoluteChange: number;
  /** null cuando el periodo anterior es 0 y no hay base para calcular un porcentaje. */
  percentChange: number | null;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

/**
 * Compara un valor actual contra un valor anterior, manejando división entre
 * cero explícitamente (percentChange = null en vez de Infinity/NaN).
 */
export function comparePeriods(current: number, previous: number): PeriodComparison {
  const absoluteChange = current - previous;

  const percentChange = previous === 0 ? null : (absoluteChange / previous) * 100;

  let trend: PeriodComparison['trend'] = 'FLAT';
  if (absoluteChange > 0) trend = 'UP';
  if (absoluteChange < 0) trend = 'DOWN';

  return { current, previous, absoluteChange, percentChange, trend };
}
