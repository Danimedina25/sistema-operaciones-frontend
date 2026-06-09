import {
  CommissionPartnerSummaryListResponse,
} from '../types/commercial-partner-commissions.types';

interface Props {
  summary: CommissionPartnerSummaryListResponse;
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

export function CommissionBeneficiarySummaryCards({
  summary,
}: Props) {

  const averagePerBeneficiary =
    summary.totalBeneficiarios > 0
      ? summary.totalComisiones /
        summary.totalBeneficiarios
      : 0;

  const cards = [
    {
      title: 'Total Generadas',
      value: formatCurrency(
        summary.totalComisiones,
      ),
    },
    {
      title: 'Total Pagadas',
      value: formatCurrency(
        summary.totalPagadas,
      ),
    },
    {
      title: 'Total Pendientes',
      value: formatCurrency(
        summary.totalPendientes,
      ),
    },
    {
      title: 'Beneficiarios',
      value: summary.totalBeneficiarios,
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

      {cards.map(card => (

        <div
          key={card.title}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >

          <p className="text-sm text-slate-500">
            {card.title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {card.value}
          </p>

        </div>

      ))}

    </div>
  );
}