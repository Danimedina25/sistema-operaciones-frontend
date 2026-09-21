import { MetricCard } from '@/shared/components/dashboard/MetricCard';
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
    { label: 'Total de entradas', value: totals?.totalEntradas, variant: 'emerald' as const },
    { label: 'Total de salidas', value: totals?.totalSalidas, variant: 'rose' as const },
    {
      label: 'Variación neta',
      value: totals?.variacionNeta,
      variant: (totals?.variacionNeta ?? 0) < 0 ? ('rose' as const) : ('default' as const),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(card => (
        <MetricCard
          key={card.label}
          label={card.label}
          value={card.value === undefined ? '—' : currency(card.value)}
          isLoading={isLoading}
          variant={card.variant}
        />
      ))}
      <p className="sm:col-span-3 text-xs text-slate-500">
        {isLoading || totals === undefined
          ? 'Calculando totales del periodo…'
          : `${totals.totalMovimientos} movimientos en el periodo consultado.`}
      </p>
    </div>
  );
}
