import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowLeftRight, ArrowUp, Banknote, Landmark } from 'lucide-react';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { PeriodSelector } from '@/shared/components/ui/PeriodSelector';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { Pagination } from '@/shared/components/ui/Pagination';
import { QueryState } from '@/shared/components/ui/QueryState';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { formatDateTime, formatMoney } from '@/shared/format';
import { getPresetRange, selectionFromDates } from '@/shared/utils/period';
import type { PeriodSelection } from '@/shared/utils/period';
import { getGeneralCut, type GeneralCut, type GeneralCutMovement } from '../api/general-cut.api';

const columns: DataTableColumn<GeneralCutMovement>[] = [
  { key: 'date', header: 'Fecha y hora', width: '19%', cell: row => formatDateTime(row.date) },
  { key: 'concept', header: 'Concepto', width: '38%', cell: row => <span className="block truncate" title={row.concept}>{row.concept}</span> },
  { key: 'source', header: 'Dónde', width: '19%', cell: row => row.source || '—' },
  { key: 'type', header: 'Tipo', kind: 'status', width: '12%', cell: row => <StatusBadge tone={row.type === 'INTERNO' ? 'active' : row.type === 'ENTRADA' ? 'success' : 'danger'}>{row.type === 'INTERNO' ? 'Interno' : row.type === 'ENTRADA' ? 'Entrada' : 'Salida'}</StatusBadge> },
  { key: 'amount', header: 'Monto', kind: 'actions', width: '12%', cell: row => <strong className={'whitespace-nowrap ' + (row.direction === 'SALIDA' ? 'text-red-600' : 'text-emerald-700')}>{formatMoney(row.direction === 'SALIDA' ? -row.amount : row.amount)}</strong> },
];

function Row({ label, cash, bank, total, strong = false, tone }: { label: string; cash: number; bank: number; total: number; strong?: boolean; tone?: 'income' | 'outflow' | 'internal' }) {
  const toneClass = tone === 'income' ? 'text-emerald-700' : tone === 'outflow' ? 'text-red-700' : tone === 'internal' ? 'text-blue-700' : '';
  return <div className={'border-b border-slate-100 px-4 py-3 text-xs sm:grid sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(82px,1fr))] sm:gap-2 sm:text-sm ' + (strong ? 'font-semibold text-slate-950' : 'text-slate-700')}>
    <span className="block font-semibold">{label}</span>
    <div className="mt-2 grid grid-cols-3 gap-2 sm:contents">
      <span className={'min-w-0 text-right text-[11px] tabular-nums sm:text-sm ' + toneClass}><small className="block text-[10px] text-slate-500 sm:hidden">Efectivo</small>{formatMoney(cash)}</span>
      <span className={'min-w-0 text-right text-[11px] tabular-nums sm:text-sm ' + toneClass}><small className="block text-[10px] text-slate-500 sm:hidden">Bancos</small>{formatMoney(bank)}</span>
      <span className={'min-w-0 text-right text-[11px] tabular-nums sm:text-sm ' + toneClass}><small className="block text-[10px] text-slate-500 sm:hidden">Total</small>{formatMoney(total)}</span>
    </div>
  </div>;
}

function Summary({ cut }: { cut: GeneralCut }) {
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 p-4"><h2 className="text-sm font-semibold text-slate-900">Resumen del corte</h2><p className="text-xs text-slate-500">Cómo cambió el dinero en el periodo, separado por tipo.</p></div>
    <div className="hidden grid-cols-[minmax(0,1fr)_repeat(3,minmax(82px,1fr))] gap-2 bg-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
      <span>Concepto</span><span className="text-right">Efectivo</span><span className="text-right">Bancos</span><span className="text-right">Total</span>
    </div>
    <Row label="Saldo inicial" cash={cut.cashInitial} bank={cut.bankInitial} total={cut.totalInitial} />
    <Row label="+ Entradas" cash={cut.cashIncome} bank={cut.bankIncome} total={cut.totalIncome} tone="income" />
    <Row label="− Salidas" cash={cut.cashOutflow} bank={cut.bankOutflow} total={cut.totalOutflow} tone="outflow" />
    <Row label="↔ Entre efectivo y bancos" cash={cut.cashInternal} bank={cut.bankInternal} total={cut.totalInternal} tone="internal" />
    <Row label="= Saldo final" cash={cut.cashFinal} bank={cut.bankFinal} total={cut.totalFinal} strong />
    <p className="bg-slate-50 px-4 py-3 text-xs text-slate-500">Movimientos internos: trasladan dinero entre Caja y bancos sin alterar el total. Pendientes de confirmación se muestran en En tránsito.</p>
    {cut.difference !== 0 && <p role="alert" className="bg-amber-50 px-4 py-3 text-xs text-amber-900">Diferencia del periodo: {formatMoney(cut.difference)}. Revisa los movimientos y los saldos iniciales.</p>}
  </section>;
}

export default function GeneralCutPage() {
  const [period, setPeriod] = useState<PeriodSelection>(() => {
    const range = getPresetRange('THIS_MONTH');
    return selectionFromDates(range.startDate, range.endDate, 'THIS_MONTH');
  });
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: ['general-cut', period.startDate, period.endDate, page],
    queryFn: () => getGeneralCut(period.startDate, period.endDate, page) });
  const cut = query.data;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><PageHeader title="Corte general" /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Solo consulta</span></div><p className="mt-1 text-sm text-slate-500">Todo el dinero del negocio: efectivo en Caja General y dinero en cuentas bancarias.</p></div>
      <PeriodSelector value={period} onApply={next => { setPeriod(next); setPage(0); }} allowAll={false} compact /></div>
    <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Calculando corte general…">
      {cut && <>
        <section className="grid gap-4 rounded-2xl bg-slate-950 p-5 text-white shadow-sm md:grid-cols-[minmax(0,1fr)_repeat(2,minmax(170px,240px))] md:p-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Dinero total al cierre del periodo</p><p className="mt-2 break-all text-3xl font-bold tabular-nums">{formatMoney(cut.totalFinal)}</p><p className="mt-2 text-xs text-slate-400">Efectivo y cuentas bancarias</p></div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4"><div className="flex items-center gap-2 text-xs text-slate-300"><Banknote size={16} /> Efectivo · Caja General</div><strong className="mt-2 block text-lg tabular-nums">{formatMoney(cut.cashFinal)}</strong></div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4"><div className="flex items-center gap-2 text-xs text-slate-300"><Landmark size={16} /> Cuentas bancarias</div><strong className="mt-2 block text-lg tabular-nums">{formatMoney(cut.bankFinal)}</strong></div>
        </section>
        <Summary cut={cut} />
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ArrowDown size={16} className="text-emerald-600" /> Entradas</h2>
            <p className="mt-3 text-xl font-semibold text-emerald-700">{formatMoney(cut.totalIncome)}</p>
            <p className="mt-2 text-xs text-slate-500">Caja {formatMoney(cut.cashIncome)} · Bancos {formatMoney(cut.bankIncome)}</p></section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ArrowUp size={16} className="text-red-600" /> Salidas</h2>
            <p className="mt-3 text-xl font-semibold text-red-700">{formatMoney(cut.totalOutflow)}</p>
            <p className="mt-2 text-xs text-slate-500">Caja {formatMoney(cut.cashOutflow)} · Bancos {formatMoney(cut.bankOutflow)}</p></section>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><ArrowLeftRight size={16} className="text-amber-600" /> En tránsito</h2><p className="text-xs text-slate-500">Registrado, pendiente de confirmación en Caja; aún no cambia los saldos.</p></div>
            {cut.transit.length ? cut.transit.map(row => <div key={row.id} className="flex justify-between gap-3 border-b border-slate-100 bg-amber-50 px-4 py-3 text-xs"><span>Retiro {row.bank} ••{row.accountLastFour}</span><strong className="whitespace-nowrap">{formatMoney(row.amount)}</strong></div>) : <p className="p-4 text-sm text-slate-500">Sin dinero en tránsito.</p>}</section>
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-semibold">Dónde está el dinero</h2><p className="text-xs text-slate-500">Saldo al cierre por Caja y banco.</p></div>
            <div className="flex justify-between gap-3 border-b border-slate-100 px-4 py-3 text-xs"><span>Caja General</span><strong>{formatMoney(cut.cashFinal)}</strong></div>
            {cut.banks.map(row => <div key={row.bank} className="flex justify-between gap-3 border-b border-slate-100 px-4 py-3 text-xs"><span>{row.bank} · {row.accounts} cuentas</span><strong className={'whitespace-nowrap ' + (row.amount < 0 ? 'text-red-600' : '')}>{formatMoney(row.amount)}</strong></div>)}</section>
        </div>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-semibold">Libro de movimientos</h2><p className="text-xs text-slate-500">Caja General y bancos · entradas, salidas e internos · solo consulta.</p></div>
          <DataTable columns={columns} rows={cut.movements} getRowKey={row => row.id}
            mobile={{ title: row => row.concept, subtitle: row => formatDateTime(row.date), fields: [
              { key: 'source', label: 'Dónde', value: row => row.source },
              { key: 'amount', label: 'Monto', value: row => formatMoney(row.direction === 'SALIDA' ? -row.amount : row.amount) },
            ] }} emptyTitle="Sin movimientos en este periodo" emptyDescription="Prueba con otro periodo para consultar el libro." />
          <div className="border-t border-slate-100 p-3"><Pagination currentPage={page + 1} totalPages={cut.totalPages} totalElements={cut.totalMovements} onPageChange={value => setPage(value - 1)} /></div>
        </section>
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900"><strong>SOLO CONSULTA · Resumen financiero</strong><br />El corte consolida efectivo y bancos del periodo seleccionado. Los movimientos en tránsito están pendientes de confirmación en destino.</p>
      </>}
    </QueryState>
  </div>;
}

