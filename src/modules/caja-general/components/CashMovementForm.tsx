import { useMemo, useRef, useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { BANK_WITHDRAWAL_CONCEPTS, CASH_MOVEMENT_CONCEPTS, type CapturableCashConcept, type CashDay, type CreateCashMovement } from '../types/caja-general.types';
import { countCents, emptyCounts, validateCashAmount } from '../utils/cash-amounts';
import { DenominationFields } from './DenominationFields';
import { Button } from '@/shared/components/ui/Button';
import { cashInput } from './CashDayForm';

type Direction = 'ENTRADA' | 'SALIDA';

export function CashMovementForm({ direction, day, busy, onSubmit }: {
  direction: Direction;
  day: CashDay;
  busy: boolean;
  onSubmit: (request: CreateCashMovement) => Promise<unknown>;
}) {
  const [type, setType] = useState<CapturableCashConcept>('EFECTIVO');
  const [bankAccountId, setBankAccountId] = useState<number | null>(null);
  const [counts, setCounts] = useState(emptyCounts);
  const [error, setError] = useState('');
  const retry = useRef<{ signature: string; id: string } | null>(null);
  const totalCents = countCents(counts);
  const { accounts, isLoading: loadingAccounts } = useBankAccounts();

  const retiraDelBanco = (BANK_WITHDRAWAL_CONCEPTS as readonly string[]).includes(type);

  // Retirar del banco sólo mete efectivo a la caja: esos conceptos no existen como salida.
  const concepts = useMemo(
    () => Object.entries(CASH_MOVEMENT_CONCEPTS)
      .filter(([value]) => direction === 'ENTRADA'
        || !(BANK_WITHDRAWAL_CONCEPTS as readonly string[]).includes(value)) as [CapturableCashConcept, string][],
    [direction],
  );

  function changeType(next: CapturableCashConcept) {
    setType(next);
    setBankAccountId(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amount = totalCents / 100;
    const problem = validateCashAmount(String(amount), counts, true);
    if (problem) { setError(problem); return; }
    if (direction === 'SALIDA' && totalCents > Math.round(day.saldoActual * 100)) {
      setError('Saldo insuficiente: la caja no puede quedar negativa.'); return;
    }
    if (retiraDelBanco && !bankAccountId) {
      setError('Selecciona la cuenta bancaria de la que salió el dinero.'); return;
    }

    const data = {
      direccion: direction,
      tipo: type,
      concepto: CASH_MOVEMENT_CONCEPTS[type],
      banco: null,
      bankAccountId: retiraDelBanco ? bankAccountId : null,
      monto: amount,
      parcialidadId: null,
      denominaciones: counts,
      comprobanteUrl: null,
    };
    // La cuenta forma parte de la firma: reintentar la misma captura conserva el UUID, y
    // cambiar de cuenta genera uno nuevo porque ya es otro movimiento.
    const signature = JSON.stringify(data);
    if (retry.current?.signature !== signature) retry.current = { signature, id: crypto.randomUUID() };
    setError('');
    try {
      await onSubmit({ ...data, requestId: retry.current.id });
      setType('EFECTIVO'); setBankAccountId(null); setCounts(emptyCounts()); retry.current = null;
    } catch (err) { setError(getApiErrorMessage(err)); }
  }

  const incoming = direction === 'ENTRADA';
  return <form onSubmit={submit} className={`space-y-5 rounded-b-2xl border bg-white p-5 ${incoming ? 'border-emerald-200' : 'border-red-200'}`}>
    <fieldset disabled={busy} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">Concepto
          <select aria-label="Concepto" value={type} onChange={event => changeType(event.target.value as CapturableCashConcept)} className={cashInput}>
            {concepts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        {retiraDelBanco ? (
          <BankAccountCombobox
            label="Banco (cuenta que se debita)"
            ariaLabel="Banco"
            accounts={accounts}
            value={bankAccountId}
            onChange={setBankAccountId}
            isLoading={loadingAccounts}
            onlyActive
          />
        ) : (
          <label className="block text-sm font-medium text-slate-700">Banco (no aplica)
            <select aria-label="Banco" disabled value="" className={cashInput}>
              <option value="">—</option>
            </select>
          </label>
        )}
      </div>

      <DenominationFields value={counts} onChange={setCounts} />

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <Button disabled={busy || !Number.isFinite(totalCents) || totalCents <= 0}
          className={incoming ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}>
          {busy ? 'Guardando…' : `Registrar ${incoming ? 'entrada' : 'salida'}`}
        </Button>
      </div>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </form>;
}
