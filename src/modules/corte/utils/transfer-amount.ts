/** Monto positivo con máximo dos decimales; devuelve el mensaje de error o null. */
export function validateTransferAmount(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Captura el monto a transferir.';
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'El monto admite máximo dos decimales.';
  if (Number(value) <= 0) return 'El monto debe ser mayor a cero.';
  return null;
}
