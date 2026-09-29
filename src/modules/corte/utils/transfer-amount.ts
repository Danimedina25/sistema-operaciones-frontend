import { validateAmountInput } from '@/shared/utils/money-input';

/** Monto positivo con máximo dos decimales; devuelve el mensaje de error o null. */
export function validateTransferAmount(raw: string): string | null {
  return validateAmountInput(raw, 'Captura el monto a transferir.');
}
