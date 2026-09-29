/**
 * Monto capturado como texto: positivo y con máximo dos decimales, igual que lo exige el
 * backend. Devuelve el mensaje de error o null.
 */
export function validateAmountInput(raw: string, emptyMessage = 'Captura el monto.'): string | null {
  const value = raw.trim();
  if (!value) return emptyMessage;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'El monto admite máximo dos decimales.';
  if (Number(value) <= 0) return 'El monto debe ser mayor a cero.';
  return null;
}
