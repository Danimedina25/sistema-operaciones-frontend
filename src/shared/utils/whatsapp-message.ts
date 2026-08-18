function formatAmount(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

export interface OperationShareMessageInput {
  operationId: number | string;
  clienteNombre: string;
  montoTotal: number;
  estatusLabel: string;
  /** Ej. "Saldo pendiente por validar: $500.00" — omitir si no aplica. */
  saldoPendienteLabel?: string | null;
  /** URL pública segura de la operación, si existe. Se omite si no hay una. */
  publicUrl?: string | null;
}

/**
 * Arma el texto para compartir una operación por WhatsApp. Incluye
 * únicamente información autorizada (folio, cliente, monto, estado, saldo
 * pendiente relevante) y NUNCA cuentas bancarias, CLABE ni comprobantes —
 * el tipo de entrada ni siquiera acepta esos campos.
 */
export function buildOperationShareMessage(input: OperationShareMessageInput): string {
  const lines = [
    `Operación #${input.operationId}`,
    `Cliente: ${input.clienteNombre}`,
    `Monto: ${formatAmount(input.montoTotal)}`,
    `Estado: ${input.estatusLabel}`,
  ];

  if (input.saldoPendienteLabel) {
    lines.push(input.saldoPendienteLabel);
  }

  if (input.publicUrl) {
    lines.push(input.publicUrl);
  }

  return lines.join('\n');
}

export interface DeliveryNoticeMessageInput {
  operationId: number | string;
  /** Fecha y hora ya formateadas para mostrar al usuario. */
  scheduledAtLabel: string;
  /** Ej. "Efectivo" o "Retiro sin tarjeta". */
  deliveryTypeLabel: string;
}

/**
 * Arma el texto de aviso manual de entrega. No incluye información bancaria
 * ni datos sensibles, solo referencia al sistema.
 */
export function buildDeliveryNoticeMessage(input: DeliveryNoticeMessageInput): string {
  return [
    `Folio: #${input.operationId}`,
    `Fecha y hora: ${input.scheduledAtLabel}`,
    `Tipo de entrega: ${input.deliveryTypeLabel}`,
    'Por favor revisa el sistema para más detalles.',
  ].join('\n');
}

export interface PaymentValidatedMessageInput {
  operationId: number | string;
  monto: number;
  publicUrl?: string | null;
}

/**
 * Aviso al socio comercial de que su comprobante de pago fue validado.
 * Sin datos bancarios ni de comprobante, solo referencia al sistema.
 */
export function buildPaymentValidatedMessage(input: PaymentValidatedMessageInput): string {
  const lines = [
    `Tu comprobante de pago por ${formatAmount(input.monto)} de la operación #${input.operationId} fue validado.`,
  ];

  if (input.publicUrl) {
    lines.push(input.publicUrl);
  }

  return lines.join('\n');
}

export interface PaymentRejectedMessageInput {
  operationId: number | string;
  monto: number;
  motivo?: string | null;
  publicUrl?: string | null;
}

export function buildPaymentRejectedMessage(input: PaymentRejectedMessageInput): string {
  const lines = [
    `Tu comprobante de pago por ${formatAmount(input.monto)} de la operación #${input.operationId} fue rechazado.`,
  ];

  if (input.motivo) {
    lines.push(`Motivo: ${input.motivo}`);
  }

  if (input.publicUrl) {
    lines.push(input.publicUrl);
  }

  return lines.join('\n');
}

export interface ReturnPaidMessageInput {
  operationId: number | string;
  monto: number;
  publicUrl?: string | null;
}

export function buildReturnPaidMessage(input: ReturnPaidMessageInput): string {
  const lines = [
    `Se realizó tu retorno por ${formatAmount(input.monto)} de la operación #${input.operationId}.`,
  ];

  if (input.publicUrl) {
    lines.push(input.publicUrl);
  }

  return lines.join('\n');
}

export interface CommissionPaidMessageInput {
  monto: number;
  publicUrl?: string | null;
}

export function buildCommissionPaidMessage(input: CommissionPaidMessageInput): string {
  const lines = [
    `Se pagó tu comisión por ${formatAmount(input.monto)}.`,
  ];

  if (input.publicUrl) {
    lines.push(input.publicUrl);
  }

  return lines.join('\n');
}
