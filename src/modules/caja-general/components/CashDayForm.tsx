import { useRef, useState, type FormEvent } from 'react';
import { Check, Lock, LockOpen, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { paths } from '@/routes/paths';
import { noteWarning, secondaryButton } from '@/shared/styles/ui-tokens';
import { CompactDenominationTables } from './CompactDenominationTables';
import { countCents, currency, emptyCounts, parseCents, validateCashAmount } from '../utils/cash-amounts';
import type { CashDay, CloseCashDay, OpenCashDay } from '../types/caja-general.types';
import { officeToday } from '@/shared/utils/period';
import { formatCashDate } from '../utils/cash-dates';

type Props = { busy: boolean; pendingWithdrawals?: { count: number; amount: number } } & (
  { mode: 'open'; previous: CashDay | null; onSubmit: (value: OpenCashDay) => Promise<unknown> } |
  { mode: 'close'; day: CashDay; onSubmit: (value: CloseCashDay) => Promise<unknown> }
);

export function CashDayForm(props: Props) {
  const fecha = officeToday();
  const [amount, setAmount] = useState(props.mode === 'open' ? String(props.previous?.saldoContado ?? 0) : '0');
  const inheritsPreviousClose = props.mode === 'open' && props.previous !== null;
  const expected = props.mode === 'close' ? props.day.denominacionesEsperadas : null;
  const hasNegativeExpected = expected != null && Object.values(expected).some(quantity => (quantity ?? 0) < 0);
  const [counts, setCounts] = useState(() => {
    if (props.mode === 'open' && props.previous) return { ...emptyCounts(), ...props.previous.cierre };
    if (props.mode === 'close' && expected) {
      const prefilled = emptyCounts();
      for (const [denomination, quantity] of Object.entries(expected)) prefilled[denomination as keyof typeof prefilled] = Math.max(0, quantity ?? 0);
      return prefilled;
    }
    return emptyCounts();
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [confirmZero, setConfirmZero] = useState(false);
  const saving = useRef(false);
  const [version] = useState(props.mode === 'close' ? props.day.version : 0);
  const changed = props.mode === 'close' && version !== props.day.version;
  const countedCents = countCents(counts);
  const capturedAmount = props.mode === 'close' ? countedCents / 100 : parseCents(amount) / 100;
  const reference = props.mode === 'close' ? props.day.saldoActual : props.previous?.saldoContado ?? null;
  const difference = reference === null ? null : countedCents / 100 - reference;

  async function save(zeroConfirmed = false) {
    if (props.busy || changed || saving.current) return;
    const problem = validateCashAmount(String(capturedAmount), counts);
    if (problem) { setError(problem); return; }
    if (props.mode === 'close' && difference !== 0 && !notes.trim()) { setError('Explica la diferencia antes de cerrar la caja.'); return; }
    setError('');
    if (Object.values(counts).every(quantity => quantity === 0) && !zeroConfirmed) { setConfirmZero(true); return; }
    setConfirmZero(false);
    saving.current = true;
    try {
      if (props.mode === 'open') await props.onSubmit({ fecha, saldoInicial: parseCents(amount) / 100, denominaciones: counts });
      else await props.onSubmit({ version, saldoContado: capturedAmount, denominaciones: counts, observaciones: notes });
    } catch { /* El hook conserva el formulario y presenta el error del servidor. */ }
    finally { saving.current = false; }
  }
  function submit(event: FormEvent) { event.preventDefault(); void save(); }

  const pending = props.pendingWithdrawals;
  return <><form onSubmit={submit} className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(300px,1fr)] lg:items-start">
    <fieldset aria-label={props.mode === 'close' ? 'Conteo final' : 'Conteo inicial'} disabled={props.busy || changed || confirmZero} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-950">{props.mode === 'close' ? 'Conteo final' : 'Conteo inicial'}</h2>
      <p className="mb-4 text-sm leading-5 text-slate-500">{props.mode === 'close'
        ? 'Ya viene prellenado con lo que debería haber en caja. Cuenta el efectivo y corrige solo lo que no coincida.'
        : props.previous
          ? `Ya viene prellenado con el conteo del último cierre (${formatCashDate(props.previous.fecha)}). Cuenta el efectivo y corrige solo lo que no coincida.`
          : 'Cuenta el efectivo y captura las cantidades para abrir la caja.'}</p>
      {hasNegativeExpected && <p role="alert" className={`mb-4 ${noteWarning}`}>Alguna denominación quedó en negativo. Se prellenó en cero; revisa el conteo con cuidado.</p>}
      <CompactDenominationTables value={counts} onChange={setCounts} disabled={inheritsPreviousClose} />
      {inheritsPreviousClose && <p className="mt-3 text-xs text-slate-500">El saldo y el conteo del último cierre se heredan sin cambios para la apertura.</p>}
    </fieldset>

    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-11">
      <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">{props.mode === 'close' ? 'Saldo esperado' : 'Saldo del último cierre'}</span><strong className="tabular-nums text-slate-950">{reference === null ? '—' : currency(reference)}</strong></div>
      {props.mode === 'open' && !props.previous && <label className="mt-4 block text-sm font-medium text-slate-700">Saldo inicial
        <input type="text" inputMode="decimal" required value={amount} onChange={event => setAmount(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 tabular-nums outline-none focus:border-blue-500" />
      </label>}
      {inheritsPreviousClose && <input aria-label="Saldo inicial" readOnly type="hidden" value={amount} />}
      <div className="mt-4 flex items-center justify-between gap-3"><span className="text-sm text-slate-500">Total contado</span><strong className="text-3xl font-bold tabular-nums tracking-tight text-slate-950">{Number.isFinite(countedCents) ? currency(countedCents / 100) : '—'}</strong></div>
      {difference !== null && Number.isFinite(difference) && <div role="status" className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-3 text-sm ${difference === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        {difference === 0 && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
        <strong className="min-w-0 flex-1">{difference === 0 ? 'El conteo cuadra exactamente' : difference > 0 ? 'Sobrante en el conteo' : 'Faltante en el conteo'}</strong>
        <span className="shrink-0 tabular-nums">Dif. {difference < 0 ? '−' : difference > 0 ? '+' : ''}{currency(Math.abs(difference))}</span>
      </div>}
      {props.mode === 'close' && pending && pending.count > 0 && <div role="note" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-800">
        <div className="flex gap-2"><Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>Hay {pending.count} {pending.count === 1 ? 'retiro' : 'retiros'} por ingresar de {currency(pending.amount)}. Si cierras sin confirmarlo, no entra en el conteo de hoy. <Link className="font-semibold underline underline-offset-2" to={`${paths.cashIncome}?tab=withdrawals`}>Ir a Entradas de efectivo › Retiros de cuentas bancarias</Link></span></div>
      </div>}
      {props.mode === 'close' && <label className="mt-4 block text-sm font-medium text-slate-700">Observaciones del cierre {difference !== null && difference !== 0 ? '(obligatorias por diferencia)' : ''}
        <textarea maxLength={500} placeholder="Opcional" value={notes} onChange={event => setNotes(event.target.value)} className="mt-1 h-20 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" />
      </label>}
      {props.mode === 'close' && props.day.fecha !== fecha && <p role="alert" className={`mt-4 ${noteWarning}`}>La caja del <strong>{formatCashDate(props.day.fecha)}</strong> quedó abierta. Ciérrala para poder abrir la de hoy; el saldo contado de ese cierre será el saldo inicial de la nueva caja.</p>}
      <button type="submit" disabled={props.busy || changed} className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${props.mode === 'open' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-slate-950 hover:bg-slate-800'}`}>
        {props.mode === 'open' ? <LockOpen className="h-4 w-4" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
        {props.busy ? 'Guardando…' : props.mode === 'open' ? 'Abrir caja con este conteo' : 'Cerrar caja con este conteo'}
      </button>
      <p className="mt-3 text-center text-xs leading-4 text-slate-500">{props.mode === 'close' ? 'Al cerrar se conserva el conteo y ya no se podrán registrar movimientos en este día.' : 'Este conteo será el saldo inicial de hoy y la caja pasará a “En operación”.'}</p>
      {changed && <p role="alert" className="mt-3 text-sm text-amber-700">La caja cambió durante el conteo. Vuelve a abrir el cierre para revisar el saldo actualizado.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  </form>
    <Modal open={confirmZero} title="Confirmar captura en cero" onClose={() => setConfirmZero(false)}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><p className="font-semibold">Todas las denominaciones están en cero.</p><p className="mt-2 text-sm">Estás capturando <strong>$0.00</strong> como {props.mode === 'close' ? 'saldo contado del corte' : 'saldo inicial de apertura'} del día <strong>{formatCashDate(props.mode === 'close' ? props.day.fecha : fecha)}</strong>.</p></div>
        <p className="text-sm text-slate-600">¿Deseas registrar este importe o volver para capturar las cantidades?</p>
        {changed && <p role="alert" className="text-sm text-amber-700">La caja cambió durante el conteo. Vuelve para revisar el saldo actualizado.</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" autoFocus onClick={() => setConfirmZero(false)} className={secondaryButton}>Volver a capturar</button><Button variant={props.mode === 'open' ? 'success' : 'primary'} type="button" disabled={props.busy || changed} onClick={() => void save(true)}>Sí, registrar $0.00</Button></div>
      </div>
    </Modal>
  </>;
}
