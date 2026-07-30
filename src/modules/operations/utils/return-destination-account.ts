export type DestinationAccountKind = 'CUENTA' | 'TARJETA';

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
