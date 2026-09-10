import { cn } from '@/shared/lib/cn';
import { STATUS_BADGE_CLASS } from './status-badge-styles';

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function StatusBadge({
  active,
  activeLabel = 'Activo',
  inactiveLabel = 'Inactivo',
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        STATUS_BADGE_CLASS,
        active
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-200 text-slate-700',
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
