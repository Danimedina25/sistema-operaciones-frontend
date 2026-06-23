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