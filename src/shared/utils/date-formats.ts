export const formatDisplayDate = (
    date: string,
) =>
    new Intl.DateTimeFormat(
        'es-MX',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        },
    ).format(
        new Date(
            date + 'T00:00:00',
        ),
    );

export function toLocalDateTime(date?: string) {
  if (!date) return undefined;

  return `${date}T00:00:00`;
}

export function dateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isoToDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}