export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value?: string | null) {
  if (!value) return '—';

  const dateOnly = value.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);

  if (!year || !month || !day) return '—';

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
  }).format(date);
}

export function formatPeriodDate(
    date: string,
) {
    const [
        year,
        month,
        day,
    ] = date
        .split('-')
        .map(Number);

    return new Intl.DateTimeFormat(
        'es-MX',
        {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        },
    ).format(
        new Date(
            year,
            month - 1,
            day,
        ),
    );
}