import { useEffect, useMemo, useRef, useState } from 'react';
import { useBeneficiarySummary } from '@/modules/comisionessocioscomerciales/hooks/use-beneficiary-summary';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { QueryState } from '@/shared/components/ui/QueryState';
import { formatMoney } from '@/shared/format';
import { Link } from 'react-router-dom';
import { paths } from '@/routes/paths';
import type { PeriodRange } from '@/modules/gerente/utils/period-range';
import type { CommissionPartnerSummaryResponse } from '@/modules/comisionessocioscomerciales/types/commercial-partner-commissions.types';

type SortColumn = 'totalOperaciones' | 'montoOperado' | 'totalComisiones';
const options: { value: SortColumn; label: string }[] = [
  { value: 'montoOperado', label: 'Monto operado' },
  { value: 'totalOperaciones', label: 'Número de operaciones' },
  { value: 'totalComisiones', label: 'Comisiones generadas' },
];
const columns: DataTableColumn<CommissionPartnerSummaryResponse>[] = [
  { key: 'name', header: 'Socio', width: '40%', cell: row => <span className="block truncate" title={row.nombre}>{row.nombre}</span> },
  { key: 'operations', header: 'Operaciones', width: '18%', cell: row => row.totalOperaciones },
  { key: 'amount', header: 'Monto operado', width: '21%', cell: row => <span className="whitespace-nowrap">{formatMoney(row.montoOperado)}</span> },
  { key: 'commissions', header: 'Comisiones', width: '21%', cell: row => <span className="whitespace-nowrap">{formatMoney(row.totalComisiones)}</span> },
];

export function CommercialPartnersRanking({ period, compact = false }: { period: PeriodRange; compact?: boolean }) {
  const { summary, isLoading, fetchSummary } = useBeneficiarySummary();
  const [sortColumn, setSortColumn] = useState<SortColumn>('montoOperado');
  const fetchRef = useRef(fetchSummary);
  useEffect(() => { fetchRef.current = fetchSummary; });
  useEffect(() => { void fetchRef.current({ startDate: period.startDate, endDate: period.endDate }); },
    [period.startDate, period.endDate]);
  const sorted = useMemo(() => [...(summary?.socios ?? [])].sort((a,b) => b[sortColumn] - a[sortColumn]),
    [summary, sortColumn]);
  if (compact) return <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Ranking de socios</h2><p className="text-xs text-slate-400">Por monto operado en el periodo (operaciones únicas)</p></div>
    <QueryState isLoading={isLoading} isEmpty={sorted.length === 0}
      loadingLabel="Cargando socios…" emptyTitle="Sin socios con actividad en este periodo">
      <div>{sorted.slice(0, 3).map((row, index) => <div key={row.beneficiaryType + '-' + row.beneficiaryId}
        className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 text-xs last:border-b-0">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700">{index + 1}</span>
        <div className="min-w-0 flex-1"><p className="truncate font-semibold" title={row.nombre}>{row.nombre}</p><p className="text-slate-500">{row.totalOperaciones} operaciones · comisión {formatMoney(row.totalComisiones)}</p></div>
        <strong className="whitespace-nowrap tabular-nums">{formatMoney(row.montoOperado)}</strong>
      </div>)}</div>
    </QueryState>
    <Link to={paths.mycomercialpartners} className="block border-t border-slate-100 px-5 py-3 text-xs font-semibold text-[#3b6ef5]">Ver ranking completo →</Link>
  </section>;
  return <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
      <h2 className="font-semibold">Socios comerciales</h2>
      <label className="flex items-center gap-2 text-xs text-slate-500">Ordenar por
        <select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
          value={sortColumn} onChange={event => setSortColumn(event.target.value as SortColumn)}>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    </div>
    <QueryState isLoading={isLoading} isEmpty={sorted.length === 0}
      loadingLabel="Cargando socios…" emptyTitle="Sin socios con actividad en este periodo">
      <DataTable columns={columns} rows={sorted} getRowKey={row => row.beneficiaryType + '-' + row.beneficiaryId}
        emptyTitle="Sin socios con actividad en este periodo"
        mobile={{ title: row => row.nombre, fields: [
          { key: 'operations', label: 'Operaciones', value: row => row.totalOperaciones },
          { key: 'amount', label: 'Monto operado', value: row => formatMoney(row.montoOperado) },
          { key: 'commissions', label: 'Comisiones', value: row => formatMoney(row.totalComisiones) },
        ] }} />
    </QueryState>
  </section>;
}
