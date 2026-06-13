import type {
  MyWeeklyCommissionsResponse,
} from '../types/commercial-partner-commissions.types';

interface MyCommissionsSummaryCardsProps {
  summary: MyWeeklyCommissionsResponse;
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
    },
  ).format(value);
}

export function MyCommissionsSummaryCards({
  summary,
}: MyCommissionsSummaryCardsProps) {

  const cards = [
    {
      title: 'Mi comisión',
      value: formatCurrency(
        summary.totalGanado,
      ),
      valueClassName:
        'text-emerald-600',
    },

    {
      title: 'Comisión de mi red',
      value: formatCurrency(
        summary.totalGanadoRed,
      ),
      valueClassName:
        'text-slate-900',
    },

    {
      title: 'Operaciones en la semana',
      value:
        summary.totalOperaciones,
      valueClassName:
        'text-slate-900',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">

      {cards.map(
        (card) => (

          <div
            key={
              card.title
            }
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >

            <p className="text-sm text-slate-500">
              {card.title}
            </p>

            <p
              className={`mt-2 text-2xl font-semibold ${card.valueClassName}`}
            >
              {card.value}
            </p>

          </div>

        ),
      )}

    </div>
  );
}