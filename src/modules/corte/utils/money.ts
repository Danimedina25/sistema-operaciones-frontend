const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export function formatMoney(value: number): string {
  return MXN.format(value);
}
