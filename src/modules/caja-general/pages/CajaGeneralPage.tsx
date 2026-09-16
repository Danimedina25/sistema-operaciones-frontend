import { useState } from 'react';
import { ArrowDown, ArrowUp, Landmark, WalletCards } from 'lucide-react';
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

type ActivePanel = 'ENTRADA' | 'SALIDA' | 'open' | 'close' | null;

function openingTime(value?: string) {
  if (!value?.includes('T')) return 'hora no disponible';
  return value.split('T')[1].slice(0, 5);
}

export default function CajaGeneralPage() {
  const { user } = useAuth();
  const canWrite = user?.roles.some(role => role === 'ADMIN' || role === 'JEFA_CAJAS');
  const canDelete = user?.roles.includes('ADMIN') ?? false;
  const today = formatDate(new Date());
  const { filters, setFilters } = useTableFilters('table-filters:caja-general', { mode: 'daily', fecha: today, startDate: today, endDate: today });
  const start = filters.mode === 'daily' ? filters.fecha : filters.startDate;
  const end = filters.mode === 'daily' ? filters.fecha : filters.endDate;
  const { latest, ledger, open, movement, close, deleteDay } = useCajaGeneral(start, end);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [deleteTarget, setDeleteTarget] = useState<CashDay | null>(null);
  const day = latest.data;
  const isOpen = !!day && !day.closedAt;
  const movements = ledger.data?.movimientos ?? [];
  const incoming = movements.filter(item => item.direccion === 'ENTRADA').reduce((sum, item) => sum + item.monto, 0);
  const outgoing = movements.filter(item => item.direccion === 'SALIDA').reduce((sum, item) => sum + item.monto, 0);
  const busy = open.isPending || movement.isPending || close.isPending || deleteDay.isPending;
  const selectDate = (fecha: string) => setFilters(current => ({ ...current, mode: 'daily', fecha }));
  const toggleMovement = (direction: 'ENTRADA' | 'SALIDA') => setActivePanel(current => current === direction ? null : direction);

  return <div className="mx-auto max-w-[1180px] space-y-6 pb-10">
    <header>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700"><Landmark className="h-4 w-4" /> Control de efectivo</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Caja General</h1>
      <p className="mt-1 text-sm text-slate-500">Control diario de entradas, salidas y corte por denominación.</p>
    </header>

    <section className="flex flex-col gap-7 rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-lg shadow-slate-950/10 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-sm text-slate-400">Saldo disponible</p><p className="mt-1 text-4xl font-bold tracking-tight">{currency(isOpen ? day.saldoActual : day?.saldoContado ?? 0)}</p></div>
      <div className="grid grid-cols-3 gap-5 sm:gap-9">
        <div className="text-right"><p className="text-xs text-slate-400">Entradas del día</p><p className="mt-1 font-semibold text-emerald-300">{currency(incoming)}</p></div>
        <div className="text-right"><p className="text-xs text-slate-400">Salidas del día</p><p className="mt-1 font-semibold text-red-300">{currency(outgoing)}</p></div>
        <div className="text-right"><p className="text-xs text-slate-400">Movimientos</p><p className="mt-1 font-semibold">{movements.length}</p></div>
      </div>
    </section>

    <section className={`flex flex-col gap-4 rounded-xl border border-l-4 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${isOpen ? 'border-slate-200 border-l-emerald-500' : 'border-slate-200 border-l-slate-400'}`}>
      <div className="flex items-start gap-3">
        <span className={`rounded-xl p-2.5 ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><WalletCards className="h-5 w-5" /></span>
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">Caja de hoy {isOpen && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />} {isOpen ? 'Abierta' : 'Cerrada'}</p>
          <p className="mt-1 text-sm text-slate-500">{day
            ? `Corte ${day.fecha} · ${isOpen ? `abierta a las ${openingTime(day.createdAt)} por ${day.abiertoPorNombre || `Usuario #${day.abiertoPor}`}` : 'sin sesión activa'} · saldo inicial ${currency(day.saldoInicial)}`
            : 'Todavía no existe un corte de Caja General.'}</p>
        </div>
      </div>
      {canWrite && <button type="button" disabled={busy} title={isOpen ? 'Inicia el conteo final de la caja abierta' : 'Inicia una nueva sesión de caja'}
        onClick={() => setActivePanel(isOpen ? 'close' : 'open')}
        className={`rounded-lg border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${isOpen ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-slate-300 text-slate-800 hover:bg-slate-50'}`}>
        {isOpen ? 'Cerrar caja' : 'Abrir caja'}
      </button>}
    </section>

    <div className="flex items-center gap-2 px-1 text-xs">
      <span className={`flex items-center gap-2 font-medium ${day ? 'text-emerald-700' : 'text-slate-400'}`}><i className={`h-2 w-2 rounded-full ${day ? 'bg-emerald-500' : 'bg-slate-300'}`} />Apertura</span><i className="h-px w-10 bg-slate-300" />
      <span className={`flex items-center gap-2 font-semibold ${isOpen && activePanel !== 'close' ? 'text-slate-950' : 'text-slate-400'}`}><i className={`h-2 w-2 rounded-full ${isOpen && activePanel !== 'close' ? 'bg-slate-950' : 'bg-slate-300'}`} />En operación</span><i className="h-px w-10 bg-slate-300" />
      <span className={`flex items-center gap-2 font-semibold ${activePanel === 'close' || (!!day?.closedAt && day.fecha === today) ? 'text-slate-950' : 'text-slate-400'}`}><i className={`h-2 w-2 rounded-full ${activePanel === 'close' || day?.closedAt ? 'bg-slate-950' : 'bg-slate-300'}`} />Cierre</span>
    </div>

    {latest.isPending && <p className="text-sm text-slate-500">Cargando caja…</p>}
    {latest.isError && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(latest.error)} <button onClick={() => void latest.refetch()}>Reintentar</button></p>}

    {activePanel === 'open' && canWrite && !isOpen && <section className="rounded-xl border border-slate-200 border-t-4 border-t-slate-950 bg-white p-5 shadow-sm">
      <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Apertura de caja</p>
      <CashDayForm key={day?.id ?? 'first'} mode="open" previous={day ?? null} busy={busy} onSubmit={async value => { const result = await open.mutateAsync(value); selectDate(result.fecha); setActivePanel(null); }} />
    </section>}

    {isOpen && canWrite && activePanel !== 'close' && <section>
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Registrar movimiento</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => toggleMovement('ENTRADA')} aria-pressed={activePanel === 'ENTRADA'} className={`flex items-start gap-3 rounded-xl border p-5 text-left transition ${activePanel === 'ENTRADA' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
          <span className={`rounded-xl p-2.5 ${activePanel === 'ENTRADA' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}><ArrowUp className="h-5 w-5" /></span>
          <span><strong className="block text-sm text-slate-950">Registrar entrada</strong><small className="mt-1 block text-slate-500">Efectivo que entra físicamente a la caja</small></span>
        </button>
        <button type="button" onClick={() => toggleMovement('SALIDA')} aria-pressed={activePanel === 'SALIDA'} className={`flex items-start gap-3 rounded-xl border p-5 text-left transition ${activePanel === 'SALIDA' ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
          <span className={`rounded-xl p-2.5 ${activePanel === 'SALIDA' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}><ArrowDown className="h-5 w-5" /></span>
          <span><strong className="block text-sm text-slate-950">Registrar salida</strong><small className="mt-1 block text-slate-500">Efectivo que sale físicamente de la caja</small></span>
        </button>
      </div>
      {(activePanel === 'ENTRADA' || activePanel === 'SALIDA') && <CashMovementForm key={`${day.id}-${activePanel}`} direction={activePanel} day={day} busy={busy} onSubmit={async data => { await movement.mutateAsync({ id: day.id, data }); selectDate(day.fecha); setActivePanel(null); }} />}
    </section>}

    {isOpen && canWrite && activePanel === 'close' && <section className="rounded-xl border border-slate-200 border-t-4 border-t-slate-950 bg-white p-5 shadow-sm">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Conteo final y cierre</p>
      <p className="mb-5 text-sm text-slate-500">Cuenta el efectivo físico disponible y compara el resultado con el saldo esperado.</p>
      <CashDayForm key={day.id} mode="close" day={day} busy={busy} onSubmit={async data => { await close.mutateAsync({ id: day.id, data }); selectDate(day.fecha); setActivePanel(null); }} />
    </section>}

    {!canWrite && latest.isSuccess && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Consulta de Caja General. Las aperturas, movimientos y cierres se registran por Jefa de Cajas o Administración.</p>}

    <section className="space-y-4 pt-2">
      <div><h2 className="text-lg font-semibold text-slate-950">Libro de movimientos</h2><p className="mt-1 text-sm text-slate-500">Consulta el flujo de efectivo y el saldo acumulado de cada corte.</p></div>
      <TableFilterSection title="Fecha del corte">
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-700">Periodo
            <select value={filters.mode} onChange={event => setFilters(current => ({ ...current, mode: event.target.value }))} className={cashInput}><option value="daily">Día</option><option value="range">Rango de fechas</option></select>
          </label>
          {filters.mode === 'daily' ? <label className="text-sm text-slate-700">Fecha
            <input type="date" value={filters.fecha} onChange={event => selectDate(event.target.value)} className={cashInput} />
          </label> : <DateRangeCalendarField startDate={filters.startDate} endDate={filters.endDate} onChange={({ startDate, endDate }) => { if (startDate && endDate) setFilters(current => ({ ...current, startDate, endDate })); }} />}
        </div>
      </TableFilterSection>
      {!start || !end || start > end ? <p role="alert">Selecciona un rango de fechas válido.</p> : <>
        {ledger.isPending && <p className="text-sm text-slate-500">Cargando movimientos…</p>}
        {ledger.isError && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(ledger.error)} <button onClick={() => void ledger.refetch()}>Reintentar</button></p>}
        {ledger.isSuccess && <CashLedgerTable ledger={ledger.data} canDelete={canDelete} onDelete={setDeleteTarget} />}
      </>}
    </section>

    <DeleteCashDayModal key={deleteTarget?.id ?? 'closed'} day={deleteTarget}
      movementCount={deleteTarget ? ledger.data?.movimientos.filter(item => item.diaId === deleteTarget.id).length ?? 0 : 0}
      isSubmitting={deleteDay.isPending} onClose={() => { if (!deleteDay.isPending) setDeleteTarget(null); }}
      onConfirm={async motivo => {
        if (!deleteTarget) return;
        try { await deleteDay.mutateAsync({ id: deleteTarget.id, version: deleteTarget.version, motivo }); setDeleteTarget(null); }
        catch { /* El modal conserva los datos para corregir o reintentar. */ }
      }} />
  </div>;
}
