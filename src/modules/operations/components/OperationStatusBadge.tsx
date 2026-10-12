import { StatusBadge, type StatusTone } from '@/shared/components/ui/StatusBadge';
import type { OperationStatus } from '../types/operations.types.ts';

interface OperationStatusBadgeProps {
  status: OperationStatus;
  isReturn?: boolean;
  className?: string;
}

const statusPresentation: Record<OperationStatus, { label: string; tone: StatusTone }> = {
  PENDIENTE_VALIDACION: { label: 'Pendiente validación', tone: 'pending' },
  INGRESO_PARCIAL: { label: 'Ingreso parcial', tone: 'pending' },
  VALIDADA: { label: 'Validada', tone: 'success' },
  RECHAZADA: { label: 'Rechazada', tone: 'danger' },
  RETORNO_PARCIAL_SOLICITADO: { label: 'Retorno parcial solicitado', tone: 'request' },
  RETORNO_TOTAL_SOLICITADO: { label: 'Retorno total solicitado', tone: 'request' },
  RETORNO_PARCIAL_ENTREGADO: { label: 'Retorno parcial entregado', tone: 'info' },
  RETORNADA: { label: 'Finalizado', tone: 'success' },
  COMPLETADA: { label: 'Finalizado', tone: 'success' },
};

export function OperationStatusBadge({
  status,
  isReturn,
  className,
}: OperationStatusBadgeProps) {
  const presentation = isReturn && status === 'VALIDADA'
    ? { label: 'Retorno por solicitar', tone: 'request' as const }
    : statusPresentation[status];

  return <StatusBadge tone={presentation.tone} className={`whitespace-nowrap ${className ?? ''}`}>{presentation.label}</StatusBadge>;
}
