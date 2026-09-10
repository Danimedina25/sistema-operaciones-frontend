import { OperationStatus } from "../types/operations.types.ts";
import { cn } from '@/shared/lib/cn';
import { STATUS_BADGE_CLASS } from '@/shared/components/ui/status-badge-styles';

interface OperationStatusBadgeProps {
  status: OperationStatus;
  isReturn?: boolean;
  className?: string;
}

const statusStyles: Record<OperationStatus, string> = {
  PENDIENTE_VALIDACION: 'bg-amber-100 text-amber-800',
  INGRESO_PARCIAL: 'bg-blue-100 text-blue-800',
  VALIDADA: 'bg-emerald-100 text-emerald-800',
  RECHAZADA: 'bg-red-100 text-red-800',

  RETORNO_PARCIAL_SOLICITADO: 'bg-orange-100 text-orange-800',
  RETORNO_TOTAL_SOLICITADO: 'bg-orange-100 text-orange-800',

  RETORNO_PARCIAL_ENTREGADO: 'bg-cyan-100 text-cyan-800',

  RETORNADA: 'bg-teal-100 text-teal-800',

  COMPLETADA: 'bg-slate-200 text-slate-800',
};

const statusLabels: Record<OperationStatus, string> = {
  PENDIENTE_VALIDACION: 'Pendiente validación',
  INGRESO_PARCIAL: 'Ingreso parcial',
  VALIDADA: 'Validada',
  RECHAZADA: 'Rechazada',

  RETORNO_PARCIAL_SOLICITADO: 'Retorno parcial solicitado',
  RETORNO_TOTAL_SOLICITADO: 'Retorno total solicitado',

  RETORNO_PARCIAL_ENTREGADO: 'Retorno parcial entregado',

  RETORNADA: 'Finalizado',

  COMPLETADA: 'Finalizado',
};

export function OperationStatusBadge({
  status,
  isReturn,
  className = '',
}: OperationStatusBadgeProps) {
  const isPendingReturnRequest =
    isReturn && status === 'VALIDADA';

  const label = isPendingReturnRequest
    ? 'Retorno por solicitar'
    : statusLabels[status];

  const style = isPendingReturnRequest
    ? 'bg-violet-100 text-violet-800'
    : statusStyles[status];

  return (
    <span
      className={cn(STATUS_BADGE_CLASS, 'font-bold', style, className)}
    >
      {label}
    </span>
  );
}
