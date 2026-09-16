import { currency } from '@/modules/caja-general/utils/cash-amounts';
import type { BankMovementTotals } from '../types/bank-movements.types';

/**
 * Totales del periodo. Vienen del endpoint de resumen y NUNCA de sumar la página
 * visible: el frontend no aproxima agregados.
 */
export function BankMovementsSummary({ totals, isLoading }: {
  totals: BankMovementTotals | undefined;
  isLoading: boolean;
}) {
  const cards = [
    { label: 'Total de entradas', value: totals?.totalEntradas, tone: 'text-emerald-700' },
    { label: 'Total de salidas', value: totals?.totalSalidas, tone: 'text-red-700' },
    {
      label: 'Variación neta',
      value: totals?.variacionNeta,
      tone: (totals?.variacionNeta ?? 0) < 0 ? 'text-red-700' : 'text-slate-900',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(card => (
        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${card.tone}`}>
            {isLoading || card.value === undefined ? '—' : currency(card.value)}
          </p>
        </div>
      ))}
      <p className="sm:col-span-3 text-xs text-slate-500">
        {isLoading || totals === undefined
          ? 'Calculando totales del periodo…'
          : `${totals.totalMovimientos} movimientos en el periodo consultado.`}
      </p>
    </div>
  );
}
