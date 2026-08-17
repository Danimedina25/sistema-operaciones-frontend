export type AgingLevel = 'GREEN' | 'YELLOW' | 'RED';

export interface AgingResult {
  level: AgingLevel;
  hoursElapsed: number;
  dateUsed: string;
}

const YELLOW_THRESHOLD_HOURS = 24;
const RED_THRESHOLD_HOURS = 48;

/**
 * Clasifica la antigüedad de un comprobante bancario en verde/amarillo/rojo.
 * Usa `effectiveDate` (fecha efectiva del comprobante) si está disponible,
 * y cae a `createdAt` si no lo está — replica la regla de negocio pedida.
 */
export function classifyAging(
  effectiveDate: string | null | undefined,
  createdAt: string,
  now: Date = new Date(),
): AgingResult {
  const dateUsed = effectiveDate ?? createdAt;
  const referenceDate = new Date(dateUsed);
  const hoursElapsed = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60);

  let level: AgingLevel = 'GREEN';
  if (hoursElapsed >= RED_THRESHOLD_HOURS) {
    level = 'RED';
  } else if (hoursElapsed >= YELLOW_THRESHOLD_HOURS) {
    level = 'YELLOW';
  }

  return { level, hoursElapsed, dateUsed };
}
