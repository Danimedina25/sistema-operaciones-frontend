/**
 * Monto capturado como texto: positivo y con máximo dos decimales, igual que lo exige el
 * backend. Devuelve el mensaje de error o null.
 */
export function validateAmountInput(raw: string, emptyMessage = 'Captura el monto.'): string | null {
  // Acepta el texto con separador de miles que produce MoneyInput ("12,500.50").
  const value = raw.replace(/,/g, '').trim();
  if (!value) return emptyMessage;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'El monto admite máximo dos decimales.';
  if (Number(value) <= 0) return 'El monto debe ser mayor a cero.';
  return null;
}

/** Texto de un monto con comas ("12,500.50") a número; null si está vacío. */
export function moneyInputToNumber(value: string): number | null {
  const raw = value.replace(/,/g, '').trim();
  return raw ? Number(raw) : null;
}
