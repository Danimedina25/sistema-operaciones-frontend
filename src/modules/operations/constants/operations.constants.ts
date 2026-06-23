import { OperationStatus, PaymentStatus, PaymentType } from "../types/operations.types.ts";

export const paymentTypeLabels: Record<PaymentType, string> = {
  TRANSFERENCIA: 'Transferencia',
  DEPOSITO: 'Depósito',
  EFECTIVO: 'Efectivo',
  CHEQUE: 'Cheque'
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDIENTE_VALIDACION: 'Pendiente',
  VALIDADA: 'Validado',
  RECHAZADA: 'Rechazado',
};

export const operationStatusLabels: Record<OperationStatus, string> = {
  PENDIENTE_VALIDACION: 'Pendiente validación',
  VALIDADA: 'Validada',
  RECHAZADA: 'Rechazada',
  RETORNO_SOLICITADO: 'Retorno solicitado',
  RETORNO_PARCIAL: 'Retorno parcial',
  COMPLETADA: 'Completada',
  INGRESO_PARCIAL: 'Ingreso parcial'
};