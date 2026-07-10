// returns/utils/return-form.utils.ts

export function normalizeCurrencyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const integerPart = parts[0] ?? '';
  const decimalPart = parts[1] ?? '';

  const normalizedInteger =
    integerPart.replace(/^0+(?=\d)/, '') || '0';

  const formattedInteger = normalizedInteger.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );

  if (parts.length === 1) {
    return formattedInteger;
  }

  return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
}

export function parseCurrency(value: string) {
  const parsed = Number(value.replace(/,/g, ''));

  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatCurrencyDisplay(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function onlyNumbers(value: string) {
  return value.replace(/\D/g, '');
}

export type ReturnPaymentType =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'DEPOSITO'
  | 'RETIRO_SIN_TARJETA';