export type DestinationAccountKind = 'CUENTA' | 'TARJETA';

export interface DestinationAccountIdentifierErrors {
  cuenta?: string;
  clabe?: string;
}

export function validateDestinationAccountIdentifiers(
  account?: string | null,
  clabeValue?: string | null,
): DestinationAccountIdentifierErrors {
  const cuenta = account?.trim() ?? '';
  const clabe = clabeValue?.trim() ?? '';

  if (!cuenta && !clabe) {
    return {
      cuenta: 'Ingresa un número de cuenta/tarjeta o una CLABE interbancaria',
    };
  }

  const errors: DestinationAccountIdentifierErrors = {};

  if (cuenta && !/^\d{10,18}$/.test(cuenta)) {
    errors.cuenta =
      'El número de cuenta o tarjeta debe tener entre 10 y 18 dígitos';
  }

  if (clabe && !/^\d{18}$/.test(clabe)) {
    errors.clabe = 'La CLABE debe tener exactamente 18 dígitos';
  }

  return errors;
}

export function detectDestinationAccountKind(
  value?: string | null,
): DestinationAccountKind | null {
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.length === 16 ? 'TARJETA' : 'CUENTA';
}

export function getDestinationAccountLabel(
  value?: string | null,
  fallback = 'Número de cuenta o tarjeta',
): string {
  const kind = detectDestinationAccountKind(value);
  if (kind === 'TARJETA') return 'Número de tarjeta';
  if (kind === 'CUENTA') return 'Número de cuenta';
  return fallback;
}
