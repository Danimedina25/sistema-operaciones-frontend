import { useState } from 'react';
import { Landmark } from 'lucide-react';
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
  const busy = open.isPending || movement.isPending || close.isPending || deleteDay.isPending;
  const selectDate = (fecha: string) => setFilters(current => ({ ...current, mode: 'daily', fecha }));
  return <div className="mx-auto max-w-[1600px] space-y-6">
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/[0.06]">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-300"><Landmark className="h-4 w-4" /> Control de efectivo</p>
        <h1 className="mt-2 text-2xl font-bold">Caja General</h1><p className="mt-1 text-sm text-slate-400">Apertura, entradas, salidas y cierre por denominación.</p>
      </div>
      <div className="p-6">
        {latest.isPending && <p>Cargando caja…</p>}
        {latest.isError && <p role="alert" className="text-red-600">{getApiErrorMessage(latest.error)} <button onClick={() => void latest.refetch()}>Reintentar</button></p>}
        {latest.isSuccess && <>
          {day && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Última caja: <strong>{day.fecha}</strong> · {day.closedAt ? 'Cerrada' : 'Abierta'}</p>
            <p className="font-semibold text-slate-900">{day.closedAt ? 'Saldo contado' : 'Saldo disponible'}: {currency(day.closedAt ? day.saldoContado ?? 0 : day.saldoActual)}</p>
          </div>}
          {canWrite ? !day || day.closedAt ? <CashDayForm key={day?.id ?? 'first'} mode="open" previous={day ?? null} busy={busy} onSubmit={async value => { const result = await open.mutateAsync(value); selectDate(result.fecha); }} /> : <>
            <div className="mb-5 flex gap-2">
              {(['movement', 'close'] as const).map(value => <button key={value} disabled={busy} onClick={() => setTab(value)} className={`rounded-xl px-4 py-3 text-sm font-semibold ${tab === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{value === 'movement' ? 'Registrar movimiento' : 'Cerrar caja'}</button>)}
            </div>
            {tab === 'movement' ? <CashMovementForm key={day.id} day={day} busy={busy} onSubmit={async data => { await movement.mutateAsync({ id: day.id, data }); selectDate(day.fecha); }} />
              : <CashDayForm key={day.id} mode="close" day={day} busy={busy} onSubmit={async data => { await close.mutateAsync({ id: day.id, data }); selectDate(day.fecha); setTab('movement'); }} />}
          </> : <p className="text-sm text-slate-600">Consulta de Caja General. Las aperturas, movimientos y cierres se registran por Jefa de Cajas o Administración.</p>}
        </>}
      </div>
    </section>
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Libro de movimientos</h2>
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
