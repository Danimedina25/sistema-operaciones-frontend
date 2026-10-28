import { StatusBadge, type StatusTone } from './StatusBadge';
import type { PendingUrgency } from '@/shared/utils/pending-urgency';

const styles: Record<PendingUrgency, { tone: StatusTone; label: string; dot: string }> = {
  none: { tone: 'success', label: 'Al día', dot: 'bg-emerald-500' },
  recent: { tone: 'neutral', label: 'En tiempo', dot: 'bg-slate-400' },
  attention: { tone: 'pending', label: 'Atender pronto', dot: 'bg-amber-500' },
  urgent: { tone: 'danger', label: 'Urgente', dot: 'bg-red-500' },
};

/** Semáforo de pendientes, igual en todos los perfiles. */
export function PendingUrgencyBadge({ urgency, className }: { urgency: PendingUrgency | null; className?: string }) {
  if (!urgency) return null;
  const style = styles[urgency];
  return <StatusBadge tone={style.tone} className={className}>
    <span aria-hidden="true" className={`mr-1.5 inline-block size-2 rounded-full ${style.dot}`} />{style.label}
  </StatusBadge>;
}
