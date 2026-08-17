import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useBeneficiarySummary } from '@/modules/comisionessocioscomerciales/hooks/use-beneficiary-summary';
import { QueryState } from '@/shared/components/ui/QueryState';
import type { PeriodRange } from '@/modules/gerente/utils/period-range';
import type { CommissionPartnerSummaryResponse } from '@/modules/comisionessocioscomerciales/types/commercial-partner-commissions.types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

type SortColumn = 'totalOperaciones' | 'montoOperado' | 'totalComisiones';

const COLUMNS: Array<{ key: SortColumn; label: string }> = [
  { key: 'totalOperaciones', label: 'Número de operaciones' },
  { key: 'montoOperado', label: 'Monto operado' },
  { key: 'totalComisiones', label: 'Comisiones generadas' },
];

interface CommercialPartnersRankingProps {
  period: PeriodRange;
}

export function CommercialPartnersRanking({ period }: CommercialPartnersRankingProps) {
  const { summary, isLoading, fetchSummary } = useBeneficiarySummary();
  const [sortColumn, setSortColumn] = useState<SortColumn>('montoOperado');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchSummaryRef = useRef(fetchSummary);
  useEffect(() => {
    fetchSummaryRef.current = fetchSummary;
  });

  useEffect(() => {
    void fetchSummaryRef.current({ startDate: period.startDate, endDate: period.endDate });
  }, [period.startDate, period.endDate]);

  const sortedSocios = useMemo<CommissionPartnerSummaryResponse[]>(() => {
    const socios = summary?.socios ?? [];

    return [...socios].sort((a, b) => {
      const diff = a[sortColumn] - b[sortColumn];
      return sortDirection === 'asc' ? diff : -diff;
    });
  }, [summary, sortColumn, sortDirection]);

  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortColumn(column);
    setSortDirection('desc');
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Ranking de socios comerciales</h2>
        <p className="text-xs text-slate-500">
          Periodo seleccionado. Haz clic en una columna para ordenar por esa métrica.
        </p>
      </div>

      <QueryState
        isLoading={isLoading}
        isEmpty={sortedSocios.length === 0}
        loadingLabel="Calculando ranking..."
        emptyTitle="Sin socios con actividad en este periodo"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium">Posición</th>
                <th className="px-4 py-3 font-medium">Socio</th>
                {COLUMNS.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      {column.label}
                      {sortColumn === column.key &&
                        (sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        ))}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSocios.map((socio, index) => (
                <tr key={socio.beneficiaryId} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3 font-bold text-slate-900">{index + 1}</td>
                  <td className="px-4 py-3 text-slate-900">{socio.nombre}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{socio.totalOperaciones}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {formatCurrency(socio.montoOperado)}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold text-emerald-700">
                    {formatCurrency(socio.totalComisiones)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
    </div>
  );
}
