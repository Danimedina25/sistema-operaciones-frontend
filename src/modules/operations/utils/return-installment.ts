import type {
  PaymentType,
  ReturnInstallment,
  ReturnInstallmentStatus,
  ReturnPaymentResponse,
} from '@/modules/operations/types/operations.types.ts';

/** Objetivo normalizado del cierre de una entrega en efectivo/retiro sin tarjeta. */
export interface CashDeliveryTarget {
  id: number;
  operationId: number;
  monto: number;
  clienteNombre?: string | null;
  autorizados: string[];
  scheduledAt?: string | null;
}

export function installmentToCashDeliveryTarget(i: ReturnInstallment): CashDeliveryTarget {
  return {
    id: i.id,
    operationId: i.operationId,
    monto: i.monto,
    clienteNombre: i.clienteNombre,
    autorizados: [
      i.autorizadoParaRecibir1,
      i.autorizadoParaRecibir2,
      i.autorizadoParaRecibir3,
    ].filter((v): v is string => Boolean(v && v.trim())),
    scheduledAt: i.fechaHoraRecoleccion ?? null,
  };
}

export interface ReturnRequestTotals {
  montoSolicitado: number;
  montoRetornado: number;
  montoEnProceso: number;
  montoPendiente: number;
  /** Tope de una nueva parcialidad: solicitado - retornado - enProceso. */
  montoDisponible: number;
  porcentajeAvance: number;
  numeroParcialidades: number;
}

/**
 * Normaliza los totales de una solicitud. El backend es la fuente de verdad;
 * esto solo aporta valores de respaldo para datos previos a las parcialidades.
 */
export function resolveReturnRequestTotals(
  request: Pick<
    ReturnPaymentResponse,
    | 'monto'
    | 'montoSolicitado'
    | 'montoRetornado'
    | 'montoEnProceso'
    | 'montoPendiente'
    | 'montoDisponible'
    | 'porcentajeAvance'
    | 'numeroParcialidades'
    | 'estatus'
  >,
): ReturnRequestTotals {
  const montoSolicitado = request.montoSolicitado ?? request.monto ?? 0;
  const montoRetornado =
    request.montoRetornado ?? (request.estatus === 'RETORNADO' ? montoSolicitado : 0);
  const montoEnProceso = request.montoEnProceso ?? 0;
  const montoPendiente =
    request.montoPendiente ?? Math.max(montoSolicitado - montoRetornado, 0);
  const montoDisponible =
    request.montoDisponible ??
    Math.max(montoSolicitado - montoRetornado - montoEnProceso, 0);
  const porcentajeAvance =
    request.porcentajeAvance ??
    (montoSolicitado > 0 ? (montoRetornado / montoSolicitado) * 100 : 0);
  const numeroParcialidades = request.numeroParcialidades ?? 0;

  return {
    montoSolicitado,
    montoRetornado,
    montoEnProceso,
    montoPendiente,
    montoDisponible,
    porcentajeAvance,
    numeroParcialidades,
  };
}

/**
 * Pendiente estimado (contra el disponible) después de registrar una
 * parcialidad de `importe`. Nunca negativo.
 */
export function computeBalanceAfterInstallment(
  montoDisponible: number,
  importe: number,
): number {
  if (!Number.isFinite(importe) || importe <= 0) {
    return montoDisponible;
  }
  return Math.max(Math.round((montoDisponible - importe) * 100) / 100, 0);
}

export function isCashReturnMethod(tipoPago: PaymentType): boolean {
  return tipoPago === 'EFECTIVO' || tipoPago === 'RETIRO_SIN_TARJETA';
}

export interface InstallmentActionAvailability {
  canRegister: boolean;
  reason: string | null;
}

/**
 * Determina si se puede registrar una parcialidad para una solicitud, y por
 * qué no cuando aplica. El backend revalida todo.
 */
export function resolveRegisterInstallmentAvailability(params: {
  totals: ReturnRequestTotals;
  estatus: ReturnPaymentResponse['estatus'];
  hasPermission: boolean;
}): InstallmentActionAvailability {
  const { totals, estatus, hasPermission } = params;

  if (!hasPermission) {
    return { canRegister: false, reason: 'No tienes permisos para este método' };
  }
  if (estatus === 'RETORNADO') {
    return { canRegister: false, reason: 'La solicitud ya fue retornada por completo' };
  }
  if (totals.montoDisponible <= 0) {
    return { canRegister: false, reason: 'No hay saldo disponible por registrar' };
  }
  return { canRegister: true, reason: null };
}

/**
 * El historial de retornos parciales solo aporta cuando hubo un desglose real.
 * Se oculta si no hay ninguna parcialidad, o si el retorno se cubrió completo en
 * un único movimiento (una sola parcialidad activa == el total solicitado).
 */
export function shouldShowInstallmentHistory(
  totals: Pick<ReturnRequestTotals, 'montoRetornado' | 'montoSolicitado'>,
  installments: Array<{ estatus: ReturnInstallmentStatus }>,
): boolean {
  if (installments.length === 0) return false;

  const activas = installments.filter((i) => i.estatus !== 'CANCELADA');
  const pagoUnicoCompleto =
    activas.length === 1 &&
    totals.montoSolicitado > 0 &&
    totals.montoRetornado >= totals.montoSolicitado - 0.005;

  return !pagoUnicoCompleto;
}

/**
 * Texto del botón para registrar el retorno. El sistema infiere si es un retorno
 * parcial o total a partir del importe capturado (y de si la solicitud ya tenía
 * actividad previa, en cuyo caso siempre es parcial).
 */
export function resolveInstallmentSubmitLabel(params: {
  totals: Pick<ReturnRequestTotals, 'montoRetornado' | 'montoEnProceso' | 'montoSolicitado'>;
  importe: number;
  esEfectivo: boolean;
}): string {
  const { totals, importe, esEfectivo } = params;

  const yaHayActividad = totals.montoRetornado > 0 || totals.montoEnProceso > 0;
  const cubreTotal =
    !yaHayActividad &&
    importe > 0 &&
    importe >= totals.montoSolicitado - 0.005;
  const esParcial = !cubreTotal && (yaHayActividad || importe > 0);

  if (esEfectivo) {
    return esParcial ? 'Programar recolección parcial' : 'Programar recolección del retorno';
  }
  return esParcial ? 'Registrar retorno parcial' : 'Registrar retorno';
}
