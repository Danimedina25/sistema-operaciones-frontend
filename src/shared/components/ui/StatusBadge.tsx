import { cn } from '@/shared/lib/cn';

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
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        active
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-200 text-slate-700',
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}