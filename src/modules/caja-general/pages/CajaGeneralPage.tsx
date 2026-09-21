import { useState } from 'react';
import { ArrowDown, ArrowUp, WalletCards } from 'lucide-react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { TableFilterSection } from '@/shared/components/ui/TableFilterSection';
import { DateRangeCalendarField } from '@/shared/components/ui/DateRangeCalendarField';
import { QueryState } from '@/shared/components/ui/QueryState';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import {
  dangerOutlineButton,
  fieldControl,
  fieldLabel,
  microTitle,
  mutedText,
  noteDanger,
  noteNeutral,
  noteWarning,
  secondaryButton,
  sectionTitle,
} from '@/shared/styles/ui-tokens';
import { isoToDate } from '@/shared/utils/date-formats';
import { formatDate } from '@/shared/utils/weeks';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { useCajaGeneral } from '../hooks/use-caja-general';
import { CashDayForm } from '../components/CashDayForm';
import { CashMovementForm } from '../components/CashMovementForm';
import { CashLedgerTable } from '../components/CashLedgerTable';
import { DeleteCashDayModal } from '../components/DeleteCashDayModal';
import type { CashDay } from '../types/caja-general.types';
import { currency } from '../utils/cash-amounts';
import { formatCashDate } from '../utils/cash-dates';

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
  const [filters, setFilters] = useState({ mode: 'daily', fecha: today, startDate: today, endDate: today });
  const start = filters.mode === 'daily' ? filters.fecha : filters.startDate;
  const end = filters.mode === 'daily' ? filters.fecha : filters.endDate;
  const { latest, ledger, open, movement, close, deleteDay } = useCajaGeneral(start, end);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [deleteTarget, setDeleteTarget] = useState<CashDay | null>(null);
  const days = ledger.data?.dias ?? [];
  const day = filters.mode === 'daily'
    ? days.find(item => item.fecha === filters.fecha)
    : days[days.length - 1];
  const viewingToday = filters.mode === 'daily' && filters.fecha === today;
  const canOperate = Boolean(canWrite && viewingToday);
  // Caja que quedó abierta de un día anterior: hay que cerrarla antes de poder abrir la de hoy.
  const pendingDay = latest.data && !latest.data.closedAt && latest.data.fecha < today ? latest.data : null;
  const closingDay = day && !day.closedAt ? day : pendingDay;
  const isOpen = !!day && !day.closedAt;
  const canClose = Boolean(canWrite && viewingToday && closingDay);
  const canStartAction = canOperate && ledger.isSuccess && (isOpen || (!day && !pendingDay));
  const movements = ledger.data?.movimientos ?? [];
  const incoming = movements.filter(item => item.direccion === 'ENTRADA').reduce((sum, item) => sum + item.monto, 0);
  const outgoing = movements.filter(item => item.direccion === 'SALIDA').reduce((sum, item) => sum + item.monto, 0);
  const busy = open.isPending || movement.isPending || close.isPending || deleteDay.isPending;
  const selectDate = (fecha: string) => {
    setActivePanel(null);
    setFilters(current => ({ ...current, mode: 'daily', fecha }));
  };
  const toggleMovement = (direction: 'ENTRADA' | 'SALIDA') => setActivePanel(current => current === direction ? null : direction);

  return <div className="space-y-3">
    <PageHeader
      title="Caja General"
      description="Control diario de entradas, salidas y corte por denominación."
    />

    <section className="flex flex-col gap-7 rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-lg shadow-slate-950/10 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-sm text-slate-400">Saldo disponible</p><p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">{currency(isOpen ? day.saldoActual : day?.saldoContado ?? 0)}</p></div>
      <div className="grid grid-cols-3 gap-5 sm:gap-9">
        <div className="text-right"><p className="text-xs text-slate-400">Entradas del día</p><p className="mt-1 font-semibold tabular-nums text-emerald-300">{currency(incoming)}</p></div>
        <div className="text-right"><p className="text-xs text-slate-400">Salidas del día</p><p className="mt-1 font-semibold tabular-nums text-red-300">{currency(outgoing)}</p></div>
        <div className="text-right"><p className="text-xs text-slate-400">Movimientos</p><p className="mt-1 font-semibold tabular-nums">{movements.length}</p></div>
      </div>
    </section>

    <TableFilterSection title="Fecha del corte">
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="caja-periodo" className={fieldLabel}>Periodo</label>
          <select id="caja-periodo" value={filters.mode} onChange={event => { setActivePanel(null); setFilters(current => ({ ...current, mode: event.target.value })); }} className={fieldControl}><option value="daily">Día</option><option value="range">Rango de fechas</option></select>
        </div>
        {filters.mode === 'daily' ? <div>
          <label htmlFor="caja-fecha" className={fieldLabel}>Fecha</label>
          <input id="caja-fecha" type="date" max={today} value={filters.fecha} onChange={event => selectDate(event.target.value)} className={fieldControl} />
        </div> : <div>
          <span className={fieldLabel}>Rango de fechas</span>
          <DateRangeCalendarField maxDate={isoToDate(today)} startDate={filters.startDate} endDate={filters.endDate} onChange={({ startDate, endDate }) => {
            if (startDate && endDate) {
              setActivePanel(null);
              setFilters(current => ({ ...current, startDate, endDate }));
            }
          }} />
        </div>}
      </div>
    </TableFilterSection>

    <section className={`flex flex-col gap-4 rounded-2xl border border-l-4 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${isOpen ? 'border-slate-200 border-l-emerald-500' : 'border-slate-200 border-l-slate-400'}`}>
      <div className="flex items-start gap-3">
        <span className={`rounded-xl p-2.5 ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><WalletCards className="h-5 w-5" /></span>
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">{filters.mode === 'daily' ? (viewingToday ? 'Caja de hoy' : `Caja del ${formatCashDate(filters.fecha)}`) : 'Último corte del periodo'} {isOpen && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />} {day ? (isOpen ? 'Abierta' : 'Cerrada') : 'Sin corte'}</p>
          <p className="mt-1 text-sm text-slate-500">{day
            ? `Corte del día ${formatCashDate(day.fecha)} · ${isOpen ? `abierta a las ${openingTime(day.createdAt)} por ${day.abiertoPorNombre || `Usuario #${day.abiertoPor}`}` : 'sin sesión activa'} · saldo inicial ${currency(day.saldoInicial)}`
            : 'Todavía no existe un corte de Caja General.'}</p>
        </div>
      </div>
      {(canStartAction || (canClose && !isOpen)) && <button type="button" disabled={busy} title={closingDay ? 'Inicia el conteo final de la caja abierta' : 'Inicia una nueva sesión de caja'}
        onClick={() => setActivePanel(closingDay ? 'close' : 'open')}
        className={closingDay ? dangerOutlineButton : secondaryButton}>
        {closingDay ? (pendingDay && !isOpen ? `Cerrar caja del ${formatCashDate(pendingDay.fecha)}` : 'Cerrar caja') : 'Abrir caja'}
      </button>}
    </section>

    <div className="flex items-center gap-2 px-1 text-xs">
      <span className={`flex items-center gap-2 font-medium ${day ? 'text-emerald-700' : 'text-slate-400'}`}><i className={`h-2 w-2 rounded-full ${day ? 'bg-emerald-500' : 'bg-slate-300'}`} />Apertura</span><i className="h-px w-10 bg-slate-300" />
      <span className={`flex items-center gap-2 font-semibold ${isOpen && activePanel !== 'close' ? 'text-slate-950' : 'text-slate-400'}`}><i className={`h-2 w-2 rounded-full ${isOpen && activePanel !== 'close' ? 'bg-slate-950' : 'bg-slate-300'}`} />En operación</span><i className="h-px w-10 bg-slate-300" />
      <span className={`flex items-center gap-2 font-semibold ${activePanel === 'close' || day?.closedAt ? 'text-slate-950' : 'text-slate-400'}`}><i className={`h-2 w-2 rounded-full ${activePanel === 'close' || day?.closedAt ? 'bg-slate-950' : 'bg-slate-300'}`} />Cierre</span>
    </div>

    {latest.isPending && <p className={mutedText}>Cargando caja…</p>}
    {latest.isError && <p role="alert" className={noteDanger}>
      {getApiErrorMessage(latest.error)}{' '}
      <button type="button" onClick={() => void latest.refetch()} className="font-semibold underline">Reintentar</button>
    </p>}

    {pendingDay && !isOpen && viewingToday && <p role="alert" className={noteWarning}>La caja del <strong>{formatCashDate(pendingDay.fecha)}</strong> quedó abierta. Ciérrala para poder abrir la de hoy; el saldo contado de ese cierre será el saldo inicial de la nueva caja.</p>}

    {activePanel === 'open' && canOperate && !day && !pendingDay && <section className="rounded-2xl border border-slate-200 border-t-4 border-t-slate-950 bg-white p-5 shadow-sm">
      <p className={`mb-4 ${microTitle}`}>Apertura de caja</p>
      <CashDayForm key={latest.data?.id ?? 'first'} mode="open" previous={latest.data ?? null} busy={busy} onSubmit={async value => { const result = await open.mutateAsync(value); selectDate(result.fecha); setActivePanel(null); }} />
    </section>}

    {isOpen && canOperate && activePanel !== 'close' && <section>
      <p className={`mb-3 ${microTitle}`}>Registrar movimiento</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => toggleMovement('ENTRADA')} aria-pressed={activePanel === 'ENTRADA'} className={`flex items-start gap-3 rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${activePanel === 'ENTRADA' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
          <span className={`rounded-xl p-2.5 ${activePanel === 'ENTRADA' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}><ArrowUp className="h-5 w-5" /></span>
          <span><strong className="block text-sm text-slate-950">Registrar entrada</strong><small className="mt-1 block text-xs text-slate-500">Efectivo que entra físicamente a la caja</small></span>
        </button>
        <button type="button" onClick={() => toggleMovement('SALIDA')} aria-pressed={activePanel === 'SALIDA'} className={`flex items-start gap-3 rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${activePanel === 'SALIDA' ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
          <span className={`rounded-xl p-2.5 ${activePanel === 'SALIDA' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}><ArrowDown className="h-5 w-5" /></span>
          <span><strong className="block text-sm text-slate-950">Registrar salida</strong><small className="mt-1 block text-xs text-slate-500">Efectivo que sale físicamente de la caja</small></span>
        </button>
      </div>
      {(activePanel === 'ENTRADA' || activePanel === 'SALIDA') && <CashMovementForm key={`${day.id}-${activePanel}`} direction={activePanel} day={day} busy={busy} onSubmit={async data => { await movement.mutateAsync({ id: day.id, data }); selectDate(day.fecha); setActivePanel(null); }} />}
    </section>}

    {closingDay && canClose && activePanel === 'close' && <section className="rounded-2xl border border-slate-200 border-t-4 border-t-slate-950 bg-white p-5 shadow-sm">
      <p className={`mb-1 ${microTitle}`}>Conteo final y cierre</p>
      <p className={`mb-5 ${mutedText}`}>Cuenta el efectivo físico disponible y compara el resultado con el saldo esperado.</p>
      <CashDayForm key={closingDay.id} mode="close" day={closingDay} busy={busy} onSubmit={async data => { await close.mutateAsync({ id: closingDay.id, data }); selectDate(closingDay.fecha); setActivePanel(null); }} />
    </section>}

    {!viewingToday && ledger.isSuccess && <p className={noteNeutral}>Modo consulta. Las fechas anteriores permiten revisar cortes y movimientos, sin abrir, cerrar ni registrar operaciones.</p>}
    {!canWrite && viewingToday && latest.isSuccess && <p className={noteNeutral}>Consulta de Caja General. Las aperturas, movimientos y cierres se registran por Jefa de Cajas o Administración.</p>}

    <section className="space-y-4 pt-2">
      <div><h2 className={sectionTitle}>Libro de movimientos</h2><p className={`mt-1 ${mutedText}`}>Consulta el flujo de efectivo y el saldo acumulado de cada corte.</p></div>
      {!start || !end || start > end || end > today ? <p role="alert" className={noteWarning}>Selecciona un rango válido que no incluya fechas futuras.</p> : (
        <QueryState
          isLoading={ledger.isPending}
          error={ledger.isError ? ledger.error : undefined}
          onRetry={() => void ledger.refetch()}
          loadingLabel="Cargando movimientos…"
          errorTitle={ledger.isError ? getApiErrorMessage(ledger.error) : undefined}
        >
          {ledger.isSuccess ? <CashLedgerTable ledger={ledger.data} canDelete={canDelete} onDelete={setDeleteTarget} /> : null}
        </QueryState>
      )}
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
