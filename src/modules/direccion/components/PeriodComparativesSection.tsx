import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { usePeriodComparatives } from '@/modules/direccion/hooks/use-period-comparatives';
import type { PeriodComparison } from '@/shared/utils/comparatives';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

function ComparisonCell({ label, comparison, isCurrency }: { label: string; comparison: PeriodComparison; isCurrency: boolean }) {
  const format = (value: number) => (isCurrency ? formatCurrency(value) : String(value));

  const TrendIcon = comparison.trend === 'UP' ? ArrowUp : comparison.trend === 'DOWN' ? ArrowDown : ArrowRight;
  const trendColor =
    comparison.trend === 'UP'
      ? 'text-emerald-600'
      : comparison.trend === 'DOWN'
        ? 'text-rose-600'
        : 'text-slate-400';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
        {format(comparison.current)}
      </p>
      <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
        <TrendIcon className="h-3.5 w-3.5" />
        {format(Math.abs(comparison.absoluteChange))}
        {comparison.percentChange === null ? (
          <span className="text-slate-400">(sin base de comparación)</span>
        ) : (
          <span>({comparison.percentChange >= 0 ? '+' : ''}{comparison.percentChange.toFixed(1)}%)</span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Anterior: {format(comparison.previous)}</p>
    </div>
  );
}

export function PeriodComparativesSection() {
  const { rows, isLoading, error, refetch } = usePeriodComparatives();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Comparativos por periodo</h2>
        <p className="text-xs text-slate-500">
          Volumen operado y operaciones completadas contra el periodo anterior equivalente.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Calculando comparativos...</p>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-800">No se pudieron calcular los comparativos.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <p className="mb-2 text-sm font-semibold text-slate-700">{row.label}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ComparisonCell label="Volumen operado" comparison={row.volumen} isCurrency />
                <ComparisonCell
                  label="Operaciones completadas"
                  comparison={row.completadas}
                  isCurrency={false}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
