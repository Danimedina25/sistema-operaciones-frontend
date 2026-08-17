import {
  PAYMENT_REJECT_REASONS,
  type PaymentRejectReasonCode,
} from '@/modules/operations/constants/operations.constants';

/**
 * Compone el texto final de rechazo a partir del motivo predefinido y el
 * contexto adicional opcional, manteniendo compatibilidad con el contrato
 * actual del backend (campo `observaciones` de texto libre).
 */
export function buildRejectReasonText(
  reasonCode: PaymentRejectReasonCode,
  extraContext: string,
): string {
  const reasonLabel =
    PAYMENT_REJECT_REASONS.find((reason) => reason.value === reasonCode)?.label ?? reasonCode;

  if (reasonCode === 'OTRO') {
    return extraContext;
  }

  return extraContext ? `${reasonLabel}: ${extraContext}` : reasonLabel;
}
