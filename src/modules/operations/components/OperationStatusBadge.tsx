import { OperationStatus } from "../types/operations.types.ts";

interface OperationStatusBadgeProps {
  status: OperationStatus;
  isReturn?: boolean;
}

const statusStyles: Record<OperationStatus, string> = {
  PENDIENTE_VALIDACION: 'bg-amber-100 text-amber-800',
  INGRESO_PARCIAL: 'bg-blue-100 text-blue-800',
  VALIDADA: 'bg-emerald-100 text-emerald-800',
  RECHAZADA: 'bg-red-100 text-red-800',
  RETORNO_PARCIAL: 'bg-cyan-100 text-cyan-800',
  COMPLETADA: 'bg-slate-200 text-slate-800',
  RETORNO_SOLICITADO: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<OperationStatus, string> = {
  PENDIENTE_VALIDACION: 'Pendiente validación',
  INGRESO_PARCIAL: 'Ingreso parcial',
  VALIDADA: 'Validada',
  RECHAZADA: 'Rechazada',
  RETORNO_PARCIAL: 'Retorno parcial',
  COMPLETADA: 'Completada',
  RETORNO_SOLICITADO: 'Retorno solicitado',
};

export function OperationStatusBadge({
  status,
  isReturn,
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
      className={`inline-flex min-w-[140px] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}