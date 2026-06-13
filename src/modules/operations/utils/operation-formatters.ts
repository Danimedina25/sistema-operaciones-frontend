export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(
  value?: string | null,
) {
  if (!value) return '—';

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'medium',
    },
  ).format(
    new Date(value),
  );
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