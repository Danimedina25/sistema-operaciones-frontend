import { useRef, useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { CASH_BANKS, CASH_MOVEMENT_CONCEPTS, type CapturableCashConcept, type CashDay, type CreateCashMovement } from '../types/caja-general.types';
import { countCents, emptyCounts, validateCashAmount } from '../utils/cash-amounts';
import { DenominationFields } from './DenominationFields';
import { cashInput } from './CashDayForm';

type Direction = 'ENTRADA' | 'SALIDA';

export function CashMovementForm({ direction, day, busy, onSubmit }: {
  direction: Direction;
  day: CashDay;
  busy: boolean;
  onSubmit: (request: CreateCashMovement) => Promise<unknown>;
}) {
  const [type, setType] = useState<CapturableCashConcept>('EFECTIVO');
  const [bank, setBank] = useState('');
  const [counts, setCounts] = useState(emptyCounts);
  const [error, setError] = useState('');
  const retry = useRef<{ signature: string; id: string } | null>(null);
  const totalCents = countCents(counts);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amount = totalCents / 100;
    const problem = validateCashAmount(String(amount), counts, true);
    if (problem) { setError(problem); return; }
    if (direction === 'SALIDA' && totalCents > Math.round(day.saldoActual * 100)) {
      setError('Saldo insuficiente: la caja no puede quedar negativa.'); return;
    }
    if (type !== 'EFECTIVO' && !bank) { setError('Selecciona el banco relacionado con el movimiento.'); return; }

    const data = {
      direccion: direction,
      tipo: type,
      concepto: CASH_MOVEMENT_CONCEPTS[type],
      banco: type === 'EFECTIVO' ? null : bank,
      monto: amount,
      parcialidadId: null,
      denominaciones: counts,
      comprobanteUrl: null,
    };
    const signature = JSON.stringify(data);
    if (retry.current?.signature !== signature) retry.current = { signature, id: crypto.randomUUID() };
    setError('');
    try {
      await onSubmit({ ...data, requestId: retry.current.id });
      setType('EFECTIVO'); setBank(''); setCounts(emptyCounts()); retry.current = null;
    } catch (err) { setError(getApiErrorMessage(err)); }
  }

  const incoming = direction === 'ENTRADA';
  return <form onSubmit={submit} className={`space-y-5 rounded-b-xl border p-5 ${incoming ? 'border-emerald-200' : 'border-red-200'}`}>
    <fieldset disabled={busy} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">Concepto
          <select aria-label="Concepto" value={type} onChange={event => { setType(event.target.value as CapturableCashConcept); setBank(''); }} className={cashInput}>
            {Object.entries(CASH_MOVEMENT_CONCEPTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">Banco {type === 'EFECTIVO' ? '(no aplica)' : ''}
          <select aria-label="Banco" disabled={type === 'EFECTIVO'} value={bank} onChange={event => setBank(event.target.value)} className={cashInput}>
            <option value="">—</option>
            {CASH_BANKS.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>

      <DenominationFields value={counts} onChange={setCounts} />

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <button disabled={busy || !Number.isFinite(totalCents) || totalCents <= 0}
          className={`rounded-lg px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${incoming ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
          {busy ? 'Guardando…' : `Registrar ${incoming ? 'entrada' : 'salida'}`}
        </button>
      </div>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </form>;
}
