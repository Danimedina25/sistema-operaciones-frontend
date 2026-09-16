export interface LabelledBankAccount {
  banco: string;
  titular: string;
  numeroCuenta: string;
}

/**
 * Etiqueta única de una cuenta bancaria en toda la aplicación.
 * Sustituye las cuatro copias que construían `Banco - Titular - Número` por su cuenta.
 */
export function formatBankAccountLabel(account: LabelledBankAccount): string {
  return `${account.titular} — ${account.banco} — ${account.numeroCuenta}`;
}

/**
 * Texto normalizado para buscar: sin mayúsculas, sin acentos y sin los separadores que la
 * gente escribe en los números de cuenta. Así "bajio" encuentra "Bajío" y "1234 5678"
 * encuentra "12345678".
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s\-.]/g, '');
}
