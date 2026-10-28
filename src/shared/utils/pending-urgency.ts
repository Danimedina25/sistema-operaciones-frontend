import { hoursSince } from '@/shared/format';

/** none: sin pendientes · recent: hay, pero aún en tiempo · attention: amarillo · urgent: rojo. */
export type PendingUrgency = 'none' | 'recent' | 'attention' | 'urgent';

export interface UrgencyThresholds {
  horasPendienteAtencion: number;
  horasPendienteUrgente: number;
}

/** El color depende del pendiente más antiguo del grupo; los umbrales vienen de Configuración. */
export function pendingUrgency(count: number, oldest: string | null | undefined, thresholds: UrgencyThresholds, now: Date = new Date()): PendingUrgency {
  if (count <= 0) return 'none';
  const hours = oldest ? hoursSince(oldest, now) : null;
  if (hours === null) return 'recent';
  if (hours >= thresholds.horasPendienteUrgente) return 'urgent';
  if (hours >= thresholds.horasPendienteAtencion) return 'attention';
  return 'recent';
}

const rank: Record<PendingUrgency, number> = { none: 0, recent: 1, attention: 2, urgent: 3 };

/** Un grupo del menú toma el color de su hijo más atrasado. */
export function worstUrgency(levels: PendingUrgency[]): PendingUrgency {
  return levels.reduce<PendingUrgency>((worst, level) => rank[level] > rank[worst] ? level : worst, 'none');
}

/** La fecha más antigua de varios grupos (LocalDateTime de la oficina, comparables como texto). */
export function oldestOf(...dates: (string | null | undefined)[]): string | null {
  return dates.filter((date): date is string => Boolean(date)).sort()[0] ?? null;
}
