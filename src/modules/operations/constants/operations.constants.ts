import { OperationDateFilter, OperationStatus, PaymentStatus, PaymentType } from "../types/operations.types.ts";

export const paymentTypeLabels: Record<PaymentType, string> = {
  TRANSFERENCIA: 'Transferencia',
  DEPOSITO: 'Depósito',
  EFECTIVO: 'Efectivo',
  CHEQUE: 'Cheque',
  RETIRO_SIN_TARJETA: 'Retiro sin tarjeta',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDIENTE_VALIDACION: 'Pendiente',
  EN_PROCESO: 'En proceso',
  VALIDADA: 'Validado',
  RECHAZADA: 'Rechazado',
};

export const dateFilterLabels: Record<OperationDateFilter, string> = {
  TODAY: 'hoy',
  THIS_WEEK: 'esta semana',
  THIS_MONTH: 'este mes',
  LAST_MONTH: 'el mes pasado',
};

/**
 * Buckets de filtro rápido sobre el listado de operaciones. El backend
 * solo admite un único `status` por consulta (no una lista), así que cada
 * bucket mapea a un estado representativo — no es un OR de varios estados.
 * El selector de estatus completo sigue disponible para los demás casos.
 */
export const OPERATIONS_QUICK_STATUS_FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDIENTE_VALIDACION', label: 'Pendientes' },
  { value: 'RECHAZADA', label: 'Rechazadas' },
  { value: 'VALIDADA', label: 'Listas para solicitar retorno' },
  { value: 'COMPLETADA', label: 'Completadas' },
] as const;

/**
 * Filtros rápidos por tipo de ingreso. El valor es el CSV que se manda tal
 * cual al backend en `paymentTypes` (ver `PaymentOperationFilterDto`).
 */
export const OPERATIONS_QUICK_PAYMENT_TYPE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DEPOSITO', label: 'Depósito' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TRANSFERENCIA,DEPOSITO,CHEQUE', label: 'Todos los bancarios' },
] as const;

export const PAYMENT_REJECT_REASONS = [
  { value: 'COMPROBANTE_ILEGIBLE', label: 'Comprobante ilegible' },
  { value: 'MONTO_INCORRECTO', label: 'Monto incorrecto' },
  { value: 'CUENTA_INCORRECTA', label: 'Cuenta incorrecta' },
  { value: 'MOVIMIENTO_NO_LOCALIZADO', label: 'Movimiento no localizado' },
  { value: 'COMPROBANTE_DUPLICADO', label: 'Comprobante duplicado' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export type PaymentRejectReasonCode = (typeof PAYMENT_REJECT_REASONS)[number]['value'];

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