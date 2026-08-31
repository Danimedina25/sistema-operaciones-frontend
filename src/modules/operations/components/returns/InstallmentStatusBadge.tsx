import { cn } from '@/shared/lib/cn';
import type { ReturnInstallmentStatus } from '../../types/operations.types.ts';

interface InstallmentStatusBadgeProps {
  status: ReturnInstallmentStatus;
}

const LABELS: Record<ReturnInstallmentStatus, string> = {
  PROGRAMADA: 'Programada',
  ENTREGADA: 'Entregada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

export function InstallmentStatusBadge({ status }: InstallmentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[110px] items-center justify-center rounded-full border px-2.5 py-1 text-center text-xs font-semibold',
        status === 'COMPLETADA' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        status === 'ENTREGADA' && 'border-indigo-200 bg-indigo-50 text-indigo-700',
        status === 'PROGRAMADA' && 'border-blue-200 bg-blue-50 text-blue-700',
        status === 'CANCELADA' && 'border-slate-200 bg-slate-100 text-slate-500',
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
