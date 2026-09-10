import { cn } from '@/shared/lib/cn';
import { STATUS_BADGE_CLASS } from '@/shared/components/ui/status-badge-styles';

interface ClienteStatusBadgeProps {
  active: boolean;
}

export function ClienteStatusBadge({ active }: ClienteStatusBadgeProps) {
  return (
    <span
      className={cn(
        STATUS_BADGE_CLASS,
        active
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-700',
      )}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}
