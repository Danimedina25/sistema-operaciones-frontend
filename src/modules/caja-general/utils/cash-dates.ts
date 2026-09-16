const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export function formatCashDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, monthText, dayText] = match;
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Number(year), month - 1, day);
  if (parsed.getFullYear() !== Number(year) || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return value;

  return `${day} de ${MONTHS[month - 1]} del ${year} (${value})`;
}

export function formatCashDateTime(value: string): string {
  const [date, time] = value.split('T');
  if (!date || !time) return value;
  return `${formatCashDate(date)} · ${time.slice(0, 5)} h`;
}
