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
  INGRESO_PARCIAL: 'Ingreso parcial',
  VALIDADA: 'Validada',
  RECHAZADA: 'Rechazada',

  RETORNO_PARCIAL_SOLICITADO: 'Retorno parcial solicitado',
  RETORNO_TOTAL_SOLICITADO: 'Retorno total solicitado',

  RETORNO_PARCIAL_ENTREGADO: 'Retorno parcial entregado',

  RETORNADA: 'Retornada',

  COMPLETADA: 'Completada',
};