import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Landmark, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { useTableFilters } from '@/shared/hooks/use-table-filters';
import { TableFilterSection } from '@/shared/components/ui/TableFilterSection';
import { DateRangeCalendarField } from '@/shared/components/ui/DateRangeCalendarField';
import { formatDate } from '@/shared/utils/weeks';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { useCajaGeneral } from '../hooks/use-caja-general';
import { CashDayForm, cashInput } from '../components/CashDayForm';
import { CashMovementForm } from '../components/CashMovementForm';
import { CashLedgerTable } from '../components/CashLedgerTable';
import { DeleteCashDayModal } from '../components/DeleteCashDayModal';
import type { CashDay } from '../types/caja-general.types';
import { currency } from '../utils/cash-amounts';
export default function CajaGeneralPage() {
  const { user } = useAuth();
  const canWrite = user?.roles.some(role => role === 'ADMIN' || role === 'JEFA_CAJAS');
  const canDelete = user?.roles.includes('ADMIN') ?? false;
  const today = formatDate(new Date());
  const { filters, setFilters } = useTableFilters('table-filters:caja-general', { mode: 'daily', fecha: today, startDate: today, endDate: today });
  const start = filters.mode === 'daily' ? filters.fecha : filters.startDate;
  const end = filters.mode === 'daily' ? filters.fecha : filters.endDate;
  const { latest, ledger, open, movement, close, deleteDay } = useCajaGeneral(start, end);
  const [tab, setTab] = useState<'movement' | 'close'>('movement');
  const [deleteTarget, setDeleteTarget] = useState<CashDay | null>(null);
  const day = latest.data;
  const visibleMovements = ledger.data?.movimientos ?? [];
  const incoming = visibleMovements.filter(item => item.direccion === 'ENTRADA').reduce((sum, item) => sum + item.monto, 0);
  const outgoing = visibleMovements.filter(item => item.direccion === 'SALIDA').reduce((sum, item) => sum + item.monto, 0);
  const busy = open.isPending || movement.isPending || close.isPending || deleteDay.isPending;
  const selectDate = (fecha: string) => setFilters(current => ({ ...current, mode: 'daily', fecha }));
  const summaryCards = [
    { label: 'Saldo disponible', value: currency(day?.closedAt ? day.saldoContado ?? 0 : day?.saldoActual ?? 0), icon: CircleDollarSign, tone: 'text-slate-900', iconTone: 'bg-blue-50 text-blue-700' },
    { label: filters.mode === 'daily' ? 'Entradas del día' : 'Entradas del periodo', value: currency(incoming), icon: ArrowDownLeft, tone: 'text-emerald-700', iconTone: 'bg-emerald-50 text-emerald-700' },
    { label: filters.mode === 'daily' ? 'Salidas del día' : 'Salidas del periodo', value: currency(outgoing), icon: ArrowUpRight, tone: 'text-red-700', iconTone: 'bg-red-50 text-red-700' },
    { label: 'Estado de caja', value: !day ? 'Sin apertura' : day.closedAt ? 'Cerrada' : 'Abierta', icon: LockKeyhole, tone: day && !day.closedAt ? 'text-emerald-700' : 'text-slate-700', iconTone: day && !day.closedAt ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600' },
  ];
  return <div className="mx-auto max-w-[1180px] space-y-6 pb-10">
    <header>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700"><Landmark className="h-4 w-4" /> Control de efectivo</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Caja General</h1>
      <p className="mt-1 text-sm text-slate-500">Control diario de entradas, salidas y corte por denominación.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map(card => <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-medium text-slate-500">{card.label}</p><p className={`mt-1 text-xl font-semibold ${card.tone}`}>{card.value}</p></div>
          <span className={`rounded-lg p-2 ${card.iconTone}`}><card.icon className="h-4 w-4" /></span>
        </div>
      </article>)}
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div><h2 className="font-semibold text-slate-950">{!day || day.closedAt ? 'Abrir caja' : 'Operación de caja'}</h2>
          <p className="mt-1 text-sm text-slate-500">{day ? `Corte ${day.fecha} · ${day.closedAt ? 'cerrado' : 'abierto'}` : 'Registra el saldo inicial para comenzar.'}</p></div>
        {day && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${day.closedAt ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{day.closedAt ? 'Caja cerrada' : 'Caja abierta'}</span>}
      </div>
      <div>
        {latest.isPending && <p>Cargando caja…</p>}
        {latest.isError && <p role="alert" className="text-red-600">{getApiErrorMessage(latest.error)} <button onClick={() => void latest.refetch()}>Reintentar</button></p>}
        {latest.isSuccess && <>
          {canWrite ? !day || day.closedAt ? <CashDayForm key={day?.id ?? 'first'} mode="open" previous={day ?? null} busy={busy} onSubmit={async value => { const result = await open.mutateAsync(value); selectDate(result.fecha); }} /> : <>
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              {(['movement', 'close'] as const).map(value => <button key={value} disabled={busy} onClick={() => setTab(value)} className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${tab === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{value === 'movement' ? 'Registrar movimiento' : 'Cerrar caja'}</button>)}
            </div>
            {tab === 'movement' ? <CashMovementForm key={day.id} day={day} busy={busy} onSubmit={async data => { await movement.mutateAsync({ id: day.id, data }); selectDate(day.fecha); }} />
              : <CashDayForm key={day.id} mode="close" day={day} busy={busy} onSubmit={async data => { await close.mutateAsync({ id: day.id, data }); selectDate(day.fecha); setTab('movement'); }} />}
          </> : <p className="text-sm text-slate-600">Consulta de Caja General. Las aperturas, movimientos y cierres se registran por Jefa de Cajas o Administración.</p>}
        </>}
      </div>
    </section>
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div><h2 className="text-lg font-semibold text-slate-950">Libro de movimientos</h2><p className="mt-1 text-sm text-slate-500">Consulta el flujo de efectivo y el saldo acumulado de cada corte.</p></div>
      <TableFilterSection title="Fecha del corte">
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-700">Periodo
            <select value={filters.mode} onChange={e => setFilters(current => ({ ...current, mode: e.target.value }))} className={cashInput}><option value="daily">Día</option><option value="range">Rango de fechas</option></select>
          </label>
          {filters.mode === 'daily' ? <label className="text-sm text-slate-700">Fecha
            <input type="date" value={filters.fecha} onChange={e => selectDate(e.target.value)} className={cashInput} />
          </label> : <DateRangeCalendarField startDate={filters.startDate} endDate={filters.endDate} onChange={({ startDate, endDate }) => { if (startDate && endDate) setFilters(current => ({ ...current, startDate, endDate })); }} />}
        </div>
      </TableFilterSection>
      {!start || !end || start > end ? <p role="alert">Selecciona un rango de fechas válido.</p> : <>
        {ledger.isPending && <p className="text-sm text-slate-500">Cargando movimientos…</p>}
        {ledger.isError && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(ledger.error)} <button onClick={() => void ledger.refetch()}>Reintentar</button></p>}
        {ledger.isSuccess && <CashLedgerTable ledger={ledger.data} canDelete={canDelete} onDelete={setDeleteTarget} />}
      </>}
    </section>
    <DeleteCashDayModal
      key={deleteTarget?.id ?? 'closed'}
      day={deleteTarget}
      movementCount={deleteTarget ? ledger.data?.movimientos.filter(item => item.diaId === deleteTarget.id).length ?? 0 : 0}
      isSubmitting={deleteDay.isPending}
      onClose={() => { if (!deleteDay.isPending) setDeleteTarget(null); }}
      onConfirm={async motivo => {
        if (!deleteTarget) return;
        try {
          await deleteDay.mutateAsync({ id: deleteTarget.id, version: deleteTarget.version, motivo });
          setDeleteTarget(null);
        } catch { /* El modal conserva los datos para corregir o reintentar. */ }
      }}
    />
  </div>;
}
