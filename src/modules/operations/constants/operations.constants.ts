import { OperationStatus, PaymentStatus, PaymentType } from "../types/operations.types.ts";

export const paymentTypeLabels: Record<PaymentType, string> = {
  TRANSFERENCIA: 'Transferencia',
  DEPOSITO: 'Depósito',
  EFECTIVO: 'Efectivo',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDIENTE_VALIDACION: 'Pendiente',
  VALIDADA: 'Validado',
  RECHAZADA: 'Rechazado',
};

export const operationStatusLabels: Record<OperationStatus, string> = {
  PENDIENTE_VALIDACION: 'Pendiente validación',
  VALIDADA: 'Validado',
  RECHAZADA: 'Rechazado',
  FACTURADA: 'Facturado',
  RETORNO_PENDIENTE: 'Retorno pendiente',
  RETORNO_PARCIAL: 'Retorno parcial',
  COMPLETADA: 'Completado',
  PAGO_PARCIAL: 'Pago parcial'
};