/**
 * Catálogo de bancos del sistema.
 *
 * Vivía exportado desde `BankAccountFormModal`, un modal de formulario, y cada pantalla
 * que lo necesitaba se traía el modal entero para leer la lista. Aquí es lo que siempre
 * fue: un catálogo.
 *
 * NO es una lista cerrada. Los campos que lo usan sugieren estos nombres pero admiten
 * cualquier otro, porque el banco emisor de un cheque puede ser uno que no esté aquí y
 * bloquear la captura sería peor que aceptar un nombre fuera del catálogo.
 */
export const MEXICAN_BANKS = [
  { value: 'ALBO', label: 'ALBO' },
  { value: 'AZTECA', label: 'AZTECA' },
  { value: 'BANCO DEL BIENESTAR', label: 'BANCO DEL BIENESTAR' },
  { value: 'BANBAJIO', label: 'BANBAJIO' },
  { value: 'BANAMEX', label: 'BANAMEX' },
  { value: 'BANCOPPEL', label: 'BANCOPPEL' },
  { value: 'BANJERCITO', label: 'BANJERCITO' },
  { value: 'BANKAOOL', label: 'BANKAOOL' },
  { value: 'BANORTE', label: 'BANORTE' },
  { value: 'BBVA MEXICO', label: 'BBVA MEXICO' },
  { value: 'COMPARTAMOS BANCO', label: 'COMPARTAMOS BANCO' },
  { value: 'FUNDACIÓN DONDÉ', label: 'FUNDACIÓN DONDÉ' },
  { value: 'HSBC', label: 'HSBC' },
  { value: 'INBURSA', label: 'INBURSA' },
  { value: 'KAPITAL', label: 'KAPITAL' },
  { value: 'KLAR', label: 'KLAR' },
  { value: 'MERCADO PAGO', label: 'MERCADO PAGO' },
  { value: 'NU MEXICO', label: 'NU MEXICO' },
  { value: 'SANTANDER', label: 'SANTANDER' },
  { value: 'SCOTIABANK', label: 'SCOTIABANK' },
  { value: 'SPIN BY OXXO', label: 'SPIN BY OXXO' },
  { value: 'STP', label: 'STP' },
] as const;

export type BankOption = (typeof MEXICAN_BANKS)[number];

/**
 * Normaliza el nombre para guardarlo: mayúsculas y sin espacios sobrantes.
 *
 * Es lo que permite que "Banorte", "BANORTE" y " banorte " se agrupen en el filtro de
 * Cheques por cobrar, que hoy no los junta porque el banco emisor se capturaba libre.
 * Los acentos SÍ se conservan: "FUNDACIÓN DONDÉ" es el nombre real del banco.
 */
export function normalizeBankName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('es-MX');
}

/** Búsqueda tolerante: ignora acentos, mayúsculas y espacios de más. */
export function matchesBank(bank: BankOption, query: string): boolean {
  const fold = (text: string) =>
    text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  const needle = fold(query.trim());
  if (!needle) return true;

  return fold(bank.label).includes(needle) || fold(bank.value).includes(needle);
}
