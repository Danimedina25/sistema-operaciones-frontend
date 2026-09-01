import type {
  PaymentType,
  ReturnInstallment,
  ReturnInstallmentStatus,
  ReturnPaymentResponse,
} from '@/modules/operations/types/operations.types.ts';

/** Texto para parcialidades históricas cerradas sin registrar la persona receptora. */
export const HISTORICAL_RECEIVER_LABEL = 'No registrado (entrega histórica)';

/**
 * Lista limpia de personas autorizadas para recibir: sin nulos, sin vacíos, sin
 * espacios sobrantes y sin duplicados (comparación sin distinguir mayúsculas ni
 * espacios internos). Conserva el primer nombre canónico visto.
 */
export function cleanAuthorizedRecipients(
  names: Array<string | null | undefined>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of names) {
    if (!raw) continue;
    const canonical = raw.trim().replace(/\s+/g, ' ');
    if (!canonical) continue;
    const key = canonical.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(canonical);
  }

  return result;
}

/** Etiqueta del selector de receptor según el método de la parcialidad. */
export function resolveDeliveryReceiverLabel(tipoPago: PaymentType): string {
  return tipoPago === 'RETIRO_SIN_TARJETA'
    ? 'Persona que realizó el retiro'
    : 'Persona que recibió el efectivo';
}

/** Etiqueta corta para el historial/detalle. */
export function resolveReceiverHistoryLabel(tipoPago: PaymentType): string {
  return tipoPago === 'RETIRO_SIN_TARJETA'
    ? 'Persona que realizó el retiro'
    : 'Persona que recibió';
}

/**
 * Valor a mostrar como persona receptora de una parcialidad. `null` cuando no
 * aplica (no es un cierre de efectivo/RST). Para cierres completados sin dato
 * devuelve el texto de entrega histórica.
 */
export function resolveInstallmentReceiverDisplay(
  i: Pick<ReturnInstallment, 'tipoPago' | 'estatus' | 'personaQueRecibioEfectivo'>,
): string | null {
  if (!isCashReturnMethod(i.tipoPago)) return null;
  if (i.personaQueRecibioEfectivo && i.personaQueRecibioEfectivo.trim()) {
    return i.personaQueRecibioEfectivo.trim();
  }
  if (i.estatus === 'COMPLETADA') return HISTORICAL_RECEIVER_LABEL;
  return null;
}

/** Objetivo normalizado del cierre de una entrega en efectivo/retiro sin tarjeta. */
export interface CashDeliveryTarget {
  id: number;
  operationId: number;
  monto: number;
  tipoPago: PaymentType;
  clienteNombre?: string | null;
  autorizados: string[];
  scheduledAt?: string | null;
}

export function installmentToCashDeliveryTarget(i: ReturnInstallment): CashDeliveryTarget {
  return {
    id: i.id,
    operationId: i.operationId,
    monto: i.monto,
    tipoPago: i.tipoPago,
    clienteNombre: i.clienteNombre,
    autorizados: cleanAuthorizedRecipients([
      i.autorizadoParaRecibir1,
      i.autorizadoParaRecibir2,
      i.autorizadoParaRecibir3,
    ]),
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

/**
 * `view`   → consulta: resumen + historial de solo lectura, sin formulario ni
 *            botones de acción.
 * `manage` → operativo: formulario para registrar/programar (si el rol lo
 *            permite) + historial con acciones (confirmar / entregar / cancelar).
 */
export type ReturnModalVariant = 'view' | 'manage';

/** Título del modal según la variante y si la solicitud es en efectivo. */
export function resolveReturnModalTitle(params: {
  variant: ReturnModalVariant;
  tipoPago: PaymentType;
  estatus: ReturnPaymentResponse['estatus'];
}): string {
  const esEfectivo = isCashReturnMethod(params.tipoPago);
  if (params.variant === 'manage') {
    if (esEfectivo) return 'Confirmar recolección';
    return params.estatus === 'RETORNADO' ? 'Retorno' : 'Retornar';
  }
  return esEfectivo ? 'Historial de recolecciones' : 'Historial de retornos';
}

/** Encabezado de la sección de historial dentro del modal. */
export function resolveReturnHistoryHeading(params: {
  variant: ReturnModalVariant;
  tipoPago: PaymentType;
}): string {
  const esEfectivo = isCashReturnMethod(params.tipoPago);
  if (params.variant === 'view') {
    return esEfectivo ? 'Historial de recolecciones' : 'Historial de retornos';
  }
  return esEfectivo ? 'Recolecciones registradas' : 'Historial de retornos parciales';
}

export interface ReturnRowActionsView {
  esEfectivo: boolean;
  /** Texto del botón principal de la fila. */
  primaryLabel: 'Ver recolección' | 'Ver retorno' | 'Retornar';
  /** Variante del modal que abre el botón principal. */
  primaryVariant: ReturnModalVariant;
  /** Muestra el botón independiente "Confirmar recolección" (solo efectivo). */
  showConfirmRecoleccion: boolean;
}

/**
 * Botones que se muestran en la fila de una solicitud de retorno.
 *
 * - Efectivo: siempre `Ver recolección` (consulta) y, si el rol puede operar
 *   sobre recolecciones y hay algo que hacer, además `Confirmar recolección`.
 * - Otros métodos: un solo botón — `Retornar` cuando el rol puede registrar,
 *   `Ver retorno` (consulta) en caso contrario.
 *
 * El historial nunca lleva acciones: viven únicamente en la variante `manage`.
 */
export function resolveReturnRowActions(params: {
  tipoPago: PaymentType;
  numeroParcialidades: number;
  /** El rol puede registrar/programar para este método y hay saldo disponible. */
  canRegister: boolean;
  isSocioComercial: boolean;
  isJefaCajas: boolean;
  isAdmin: boolean;
}): ReturnRowActionsView {
  const esEfectivo = isCashReturnMethod(params.tipoPago);

  if (esEfectivo) {
    const rolPuedeOperar =
      params.isSocioComercial || params.isJefaCajas || params.isAdmin;
    return {
      esEfectivo: true,
      primaryLabel: 'Ver recolección',
      primaryVariant: 'view',
      showConfirmRecoleccion:
        rolPuedeOperar &&
        (params.numeroParcialidades > 0 || params.canRegister),
    };
  }

  return {
    esEfectivo: false,
    primaryLabel: params.canRegister ? 'Retornar' : 'Ver retorno',
    primaryVariant: params.canRegister ? 'manage' : 'view',
    showConfirmRecoleccion: false,
  };
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
