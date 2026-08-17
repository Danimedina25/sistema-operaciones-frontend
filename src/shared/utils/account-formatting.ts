/**
 * Enmascara un número de cuenta o CLABE, mostrando solo los últimos 4
 * dígitos. Evita mostrar el número completo cuando no es necesario.
 */
export function maskAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber) return '—';

  const digitsOnly = accountNumber.replace(/\s+/g, '');

  if (digitsOnly.length <= 4) return digitsOnly;

  const lastFour = digitsOnly.slice(-4);

  return `••••${lastFour}`;
}
