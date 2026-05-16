import { OperationStatus } from "../types/operations.types.ts";

interface OperationStatusBadgeProps {
  status: OperationStatus;
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

export function OperationStatusBadge({ status }: OperationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-w-[140px] items-center justify-center text-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}