interface BankAccountStatusBadgeProps {
  active: boolean;
}

export function BankAccountStatusBadge({
  active,
}: BankAccountStatusBadgeProps) {
  return (
    <span
      className={`${STATUS_BADGE_CLASS} ${
        active
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      {active ? 'Activa' : 'Inactiva'}
    </span>
  );
}
import { STATUS_BADGE_CLASS } from '@/shared/components/ui/status-badge-styles';
