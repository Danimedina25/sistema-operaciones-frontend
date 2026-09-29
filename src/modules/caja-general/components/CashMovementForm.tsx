import { useRef, useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { CashDay, CreateCashMovement } from '../types/caja-general.types';
import { countCents, emptyCounts, validateCashAmount } from '../utils/cash-amounts';
import { DenominationFields } from './DenominationFields';
import { Button } from '@/shared/components/ui/Button';

type Direction = 'ENTRADA' | 'SALIDA';

/**
 * Entrada o salida manual de efectivo. Los cheques y retiros de una cuenta no se capturan
 * aquí: los registra Cuentas y entran al confirmarlos en "Retiros por confirmar", para que el
 * mismo dinero no se cuente dos veces.
 */
export function CashMovementForm({ direction, day, busy, onSubmit }: {
  direction: Direction;
  day: CashDay;
  busy: boolean;
  onSubmit: (request: CreateCashMovement) => Promise<unknown>;
}) {
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

    const data = {
      direccion: direction,
      tipo: 'EFECTIVO' as const,
      concepto: 'Efectivo',
      banco: null,
      bankAccountId: null,
      monto: amount,
      parcialidadId: null,
      denominaciones: counts,
      comprobanteUrl: null,
    };
    // Reintentar la misma captura conserva el UUID; cambiar el desglose genera uno nuevo.
    const signature = JSON.stringify(data);
    if (retry.current?.signature !== signature) retry.current = { signature, id: crypto.randomUUID() };
    setError('');
    try {
      await onSubmit({ ...data, requestId: retry.current.id });
      setCounts(emptyCounts()); retry.current = null;
    } catch (err) { setError(getApiErrorMessage(err)); }
  }

  const incoming = direction === 'ENTRADA';
  return <form onSubmit={submit} className={`space-y-5 rounded-b-2xl border bg-white p-5 ${incoming ? 'border-emerald-200' : 'border-red-200'}`}>
    <fieldset disabled={busy} className="space-y-5">
      <p className="text-sm text-slate-600">
        Concepto: <strong className="text-slate-900">Efectivo</strong>.
        {incoming ? ' Los cheques y retiros de una cuenta entran desde "Retiros por confirmar".' : null}
      </p>

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
