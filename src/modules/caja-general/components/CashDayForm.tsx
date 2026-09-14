import { useState, type FormEvent } from 'react';
import { DenominationFields } from './DenominationFields';
import { currency, emptyCounts, parseCents, validateCashAmount } from '../utils/cash-amounts';
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
  const [counts, setCounts] = useState(emptyCounts);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  // Captura la versión al iniciar el conteo; una actualización remota no debe aceptar silenciosamente un cierre viejo.
  const [version] = useState(props.mode === 'close' ? props.day.version : 0);
  const changed = props.mode === 'close' && version !== props.day.version;
  const difference = props.mode === 'close' ? (parseCents(amount) - Math.round(props.day.saldoActual * 100)) / 100 : 0;
  async function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validateCashAmount(amount, counts);
    if (problem) { setError(problem); return; }
    if (props.mode === 'close' && difference !== 0 && !notes.trim()) { setError('Explica la diferencia antes de cerrar la caja.'); return; }
    setError('');
    try {
      if (props.mode === 'open') await props.onSubmit({ fecha, saldoInicial: parseCents(amount) / 100, denominaciones: counts });
      else await props.onSubmit({ version, saldoContado: parseCents(amount) / 100, denominaciones: counts, observaciones: notes });
    } catch { /* El hook conserva el formulario y presenta el error del servidor. */ }
  }
  return <form onSubmit={submit} className="space-y-4">
    <fieldset disabled={props.busy || changed} className="space-y-4">
      {props.mode === 'open' && <label className="block text-sm font-medium text-slate-700">Fecha de apertura
        <input type="date" required max={formatDate(new Date())} value={fecha} onChange={e => setFecha(e.target.value)} className={cashInput} />
      </label>}
      {props.mode === 'open' && props.previous && <p className="text-sm text-slate-600">Último cierre contado: {currency(props.previous.saldoContado ?? 0)}. El saldo inicial debe coincidir.</p>}
      <label className="block text-sm font-medium text-slate-700">{props.mode === 'open' ? 'Saldo inicial' : 'Saldo contado'}
        <input type="text" inputMode="decimal" required value={amount} onChange={e => setAmount(e.target.value)} className={cashInput} />
      </label>
      <DenominationFields value={counts} onChange={setCounts} />
      {props.mode === 'close' && <>
        <p className="rounded-xl bg-slate-50 p-4 text-sm">Saldo esperado: <strong>{currency(props.day.saldoActual)}</strong> · Diferencia: <strong>{Number.isFinite(difference) ? currency(difference) : '—'}</strong></p>
        <label className="block text-sm font-medium text-slate-700">Observaciones del cierre {difference !== 0 ? '(obligatorias por diferencia)' : ''}
          <textarea maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} className={`${cashInput} h-24 py-3`} />
        </label>
        <p className="text-sm text-slate-600">Al cerrar se conserva el conteo y ya no se podrán registrar movimientos en este día.</p>
      </>}
      <button disabled={props.busy || changed} className={cashButton}>{props.busy ? 'Guardando…' : props.mode === 'open' ? 'Abrir caja' : 'Confirmar cierre de caja'}</button>
    </fieldset>
    {changed && <p role="alert" className="text-sm text-amber-700">La caja cambió durante el conteo. Vuelve a la pestaña de movimientos y abre nuevamente el cierre para revisar el saldo actualizado.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </form>;
}
