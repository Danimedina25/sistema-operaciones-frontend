import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { ActionDrawer, ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { MoneyInput } from '@/shared/components/ui/MoneyInput';
import { moneyInputToNumber } from '@/shared/utils/money-input';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { BankTransfer, CreateBankTransfer } from '../types/bank-transfers.types';
import { validateTransferAmount } from '../utils/transfer-amount';
import { fitsAvailable, useAccountAvailability } from '../hooks/use-account-availability';
import { AvailabilityHint } from './AvailabilityHint';
import { formatMoney } from '@/shared/format';

/**
 * Transferencia entre cuentas propias. La cuenta beneficiaria excluye a la origen y la cuenta
 * origen no puede quedar en negativo: se muestra su disponible y no se envía un monto mayor.
 * El UUID de la solicitud se conserva al reintentar la misma captura para que un doble clic
 * o un error de red no la registren dos veces.
 */
export function BankTransferForm({ onClose, onSubmit, showSummary = false, onBusyChange }: {
  onClose: () => void;
  onSubmit: (request: CreateBankTransfer) => Promise<BankTransfer>;
  showSummary?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { accounts, isLoading } = useBankAccounts();
  const [origenId, setOrigenId] = useState<number | null>(null);
  const [destinoId, setDestinoId] = useState<number | null>(null);
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const formId = useId();
  const submitting = useRef(false);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  const retry = useRef<{ signature: string; id: string } | null>(null);

  const destinos = useMemo(() => accounts.filter(account => account.id !== origenId), [accounts, origenId]);
  const availability = useAccountAvailability(origenId);
  const destinationAvailability = useAccountAvailability(destinoId);
  const amount = validateTransferAmount(monto) ? null : moneyInputToNumber(monto);
  const originAccount = accounts.find(account => account.id === origenId);
  const destinationAccount = accounts.find(account => account.id === destinoId);

  function reset() {
    setOrigenId(null); setDestinoId(null); setMonto(''); setReferencia(''); setError('');
    retry.current = null;
  }

  function close() {
    if (submitting.current) return;
    reset();
    onClose();
  }

  function changeOrigen(next: number | null) {
    setOrigenId(next); setError('');
    if (next !== null && next === destinoId) setDestinoId(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!origenId) { setError('Selecciona la cuenta de la que sale el dinero.'); return; }
    if (!destinoId) { setError('Selecciona la cuenta beneficiaria.'); return; }
    const amountError = validateTransferAmount(monto);
    if (amountError) { setError(amountError); return; }
    if (!fitsAvailable(availability, moneyInputToNumber(monto))) { setError('Saldo insuficiente en la cuenta origen.'); return; }

    const data = {
      cuentaOrigenId: origenId,
      cuentaDestinoId: destinoId,
      monto: moneyInputToNumber(monto) ?? 0,
      referencia: referencia.trim() || null,
      comprobanteUrl: null,
    };
    const signature = JSON.stringify(data);
    if (retry.current?.signature !== signature) retry.current = { signature, id: crypto.randomUUID() };
    setError('');
    submitting.current = true;
    setBusy(true);
    try {
      await onSubmit({ ...data, requestId: retry.current.id });
      reset();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
      <form id={formId} onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className={showSummary ? 'grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]' : 'space-y-5'}>
          <div className={showSummary ? 'space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' : 'space-y-5'}>
          {showSummary && <h2 className="text-sm font-semibold text-slate-950">Datos de la transferencia</h2>}
          {!showSummary && <FinancialSummaryCard label="Resumen de la transferencia" errors={[error]}
            note="El monto sale de la cuenta origen y entra a la beneficiaria en el mismo momento. Queda en el libro de movimientos de las dos cuentas.">
            {origenId ? <AvailabilityHint availability={availability} amount={error ? null : amount} /> : null}
          </FinancialSummaryCard>}
          <div className="grid gap-4 md:grid-cols-2">
            <BankAccountCombobox
              label="Cuenta origen"
              accounts={accounts}
              value={origenId}
              onChange={changeOrigen}
              isLoading={isLoading}
              onlyActive
            />
            <BankAccountCombobox
              label="Cuenta beneficiaria"
              accounts={destinos}
              value={destinoId}
              onChange={id => { setDestinoId(id); setError(''); }}
              isLoading={isLoading}
              disabled={!origenId}
              placeholder={origenId ? undefined : 'Selecciona primero la cuenta origen'}
              onlyActive
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Monto
              <MoneyInput ariaLabel="Monto" value={monto} onChange={value => { setMonto(value); setError(''); }} className="mt-1" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Referencia (opcional)
              <Input
                aria-label="Referencia"
                maxLength={300}
                placeholder="Folio SPEI, clave de rastreo…"
                value={referencia}
                onChange={event => setReferencia(event.target.value)}
                className="mt-1"
              />
            </label>
          </div>

          </div>
          {showSummary && <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Resumen de la transferencia">
            <h3 className="text-sm font-semibold text-slate-950">Resumen de la transferencia</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3"><p className="font-semibold uppercase tracking-wide text-slate-500">Origen</p><p className="mt-1 font-semibold text-slate-950">{originAccount ? `${originAccount.banco} · ${originAccount.titular}` : 'Selecciona una cuenta'}</p><p className="mt-1 text-slate-600">Saldo disponible: {availability.disponible === null ? '—' : formatMoney(availability.disponible)}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="font-semibold uppercase tracking-wide text-slate-500">Beneficiaria</p><p className="mt-1 font-semibold text-slate-950">{destinationAccount ? `${destinationAccount.banco} · ${destinationAccount.titular}` : 'Selecciona una cuenta'}</p><p className="mt-1 text-slate-600">Saldo actual: {destinationAvailability.saldo === null ? '—' : formatMoney(destinationAvailability.saldo)}</p></div>
            </div>
            {(error || (origenId && !fitsAvailable(availability, amount) ? 'Saldo insuficiente en la cuenta origen.' : '')) && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error || 'Saldo insuficiente en la cuenta origen.'}</p>}
            <p className="mt-3 text-xs text-slate-500">Los saldos resultantes se registran al confirmar la transferencia.</p>
          </aside>}
        </fieldset>
        <ActionDrawerFooter><div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="neutral" disabled={busy} onClick={close}>Cancelar</Button>
          <Button type="submit" form={formId} variant="primary" isLoading={busy}>Registrar transferencia</Button>
        </div></ActionDrawerFooter>
      </form>
  );
}

export function BankTransferModal({ open, onClose, onSubmit }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: CreateBankTransfer) => Promise<BankTransfer>;
}) {
  const [busy, setBusy] = useState(false);
  return <ActionDrawer open={open} title="Registrar transferencia entre cuentas" busy={busy} onClose={onClose}>
    {open && <BankTransferForm onClose={onClose} onSubmit={onSubmit} onBusyChange={setBusy} />}
  </ActionDrawer>;
}
