import { useRef, useState, type FormEvent } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { DenominationFields } from './DenominationFields';
import { countCents, currency, emptyCounts, parseCents, validateCashAmount } from '../utils/cash-amounts';
import type { CashDay, CloseCashDay, OpenCashDay } from '../types/caja-general.types';
import { formatDate } from '@/shared/utils/weeks';
export const cashInput = 'mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200';
export const cashButton = 'rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50';
type Props = { busy: boolean } & (
  { mode: 'open'; previous: CashDay | null; onSubmit: (value: OpenCashDay) => Promise<unknown> } |
  { mode: 'close'; day: CashDay; onSubmit: (value: CloseCashDay) => Promise<unknown> }
);
export function CashDayForm(props: Props) {
  const [fecha, setFecha] = useState(formatDate(new Date()));
  const [amount, setAmount] = useState(props.mode === 'open' ? String(props.previous?.saldoContado ?? 0) : '0');
  const inheritsPreviousClose = props.mode === 'open' && props.previous !== null;
  const [counts, setCounts] = useState(() => props.mode === 'open' && props.previous
    ? { ...emptyCounts(), ...props.previous.cierre }
    : emptyCounts());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [confirmZero, setConfirmZero] = useState(false);
  const saving = useRef(false);
  // Captura la versión al iniciar el conteo; una actualización remota no debe aceptar silenciosamente un cierre viejo.
  const [version] = useState(props.mode === 'close' ? props.day.version : 0);
  const changed = props.mode === 'close' && version !== props.day.version;
  const countedCents = countCents(counts);
  const capturedAmount = props.mode === 'close' ? countedCents / 100 : parseCents(amount) / 100;
  const difference = props.mode === 'close' ? capturedAmount - props.day.saldoActual : 0;
  async function save(zeroConfirmed = false) {
    if (props.busy || changed || saving.current) return;
    const problem = validateCashAmount(String(capturedAmount), counts);
    if (problem) { setError(problem); return; }
    if (props.mode === 'close' && difference !== 0 && !notes.trim()) { setError('Explica la diferencia antes de cerrar la caja.'); return; }
    setError('');
    if (Object.values(counts).every(quantity => quantity === 0) && !zeroConfirmed) {
      setConfirmZero(true);
      return;
    }
    setConfirmZero(false);
    saving.current = true;
    try {
      if (props.mode === 'open') await props.onSubmit({ fecha, saldoInicial: parseCents(amount) / 100, denominaciones: counts });
      else await props.onSubmit({ version, saldoContado: capturedAmount, denominaciones: counts, observaciones: notes });
    } catch { /* El hook conserva el formulario y presenta el error del servidor. */ }
    finally { saving.current = false; }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void save();
  }
  return <><form onSubmit={submit} className="space-y-4">
    <fieldset disabled={props.busy || changed || confirmZero} className="space-y-4">
      {props.mode === 'open' && <label className="block text-sm font-medium text-slate-700">Fecha de apertura
        <input type="date" required max={formatDate(new Date())} value={fecha} onChange={e => setFecha(e.target.value)} className={cashInput} />
      </label>}
      {props.mode === 'open' && props.previous && <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">Saldo y denominaciones heredados del corte del <strong>{props.previous.fecha}</strong>: {currency(props.previous.saldoContado ?? 0)}. Revisa los datos y confirma la apertura.</p>}
      {props.mode === 'open' && <label className="block text-sm font-medium text-slate-700">Saldo inicial
        <input type="text" inputMode="decimal" required readOnly={inheritsPreviousClose} value={amount} onChange={e => setAmount(e.target.value)} className={`${cashInput} ${inheritsPreviousClose ? 'cursor-not-allowed bg-slate-50 text-slate-600' : ''}`} />
      </label>}
      <DenominationFields value={counts} onChange={setCounts} disabled={inheritsPreviousClose} />
      {props.mode === 'close' && <>
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-600">Saldo esperado: <strong className="text-slate-950">{currency(props.day.saldoActual)}</strong></span>
          <span className={`font-semibold ${difference === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {!Number.isFinite(difference) ? 'Revisa las cantidades' : difference === 0 ? 'El conteo cuadra exactamente' : `${difference > 0 ? 'Sobrante' : 'Faltante'}: ${currency(Math.abs(difference))}`}
          </span>
        </div>
        <label className="block text-sm font-medium text-slate-700">Observaciones del cierre {difference !== 0 ? '(obligatorias por diferencia)' : ''}
          <textarea maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} className={`${cashInput} h-24 py-3`} />
        </label>
        <p className="text-sm text-slate-600">Al cerrar se conserva el conteo y ya no se podrán registrar movimientos en este día.</p>
      </>}
      <div className="flex justify-end"><button disabled={props.busy || changed} className={cashButton}>{props.busy ? 'Guardando…' : props.mode === 'open' ? 'Abrir caja' : 'Cerrar caja con este conteo'}</button></div>
    </fieldset>
    {changed && <p role="alert" className="text-sm text-amber-700">La caja cambió durante el conteo. Vuelve a la pestaña de movimientos y abre nuevamente el cierre para revisar el saldo actualizado.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </form>
    <Modal open={confirmZero} title="Confirmar captura en cero" onClose={() => setConfirmZero(false)}>
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Todas las denominaciones están en cero.</p>
          <p className="mt-2 text-sm">Estás capturando <strong>$0.00</strong> como {props.mode === 'close' ? 'saldo contado del corte' : 'saldo inicial de apertura'} del día <strong>{props.mode === 'close' ? props.day.fecha : fecha}</strong>.</p>
        </div>
        <p className="text-sm text-slate-600">¿Deseas registrar este importe o volver para capturar las cantidades?</p>
        {changed && <p role="alert" className="text-sm text-amber-700">La caja cambió durante el conteo. Vuelve para revisar el saldo actualizado.</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" autoFocus onClick={() => setConfirmZero(false)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Volver a capturar</button>
          <button type="button" disabled={props.busy || changed} onClick={() => void save(true)} className={cashButton}>Sí, registrar $0.00</button>
        </div>
      </div>
    </Modal>
  </>;
}
