import { useRef, useState, type FormEvent } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { MoneyInput } from '@/shared/components/ui/MoneyInput';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { moneyInputToNumber, validateCashAmountInput } from '@/shared/utils/money-input';
import { WITHDRAWAL_METHODS, type BankCashWithdrawal, type RegisterWithdrawal, type WithdrawalMethod } from '@/modules/cash-withdrawals/types';
import { fitsAvailable, useAccountAvailability } from '../hooks/use-account-availability';
import { AvailabilityHint } from './AvailabilityHint';

const selectClass = 'mt-1 flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

/**
 * Efectivo que sale de una cuenta con destino a Caja General. Queda en tránsito hasta que
 * la Jefa de Cajas lo recibe y lo confirma: hasta entonces el saldo del banco no baja, pero
 * ese dinero ya no está disponible para otra salida.
 */
export function RegisterWithdrawalModal({ open, onClose, onSubmit }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: RegisterWithdrawal) => Promise<BankCashWithdrawal>;
}) {
  const { accounts, isLoading } = useBankAccounts();
  const [bankAccountId, setBankAccountId] = useState<number | null>(null);
  const [forma, setForma] = useState<WithdrawalMethod>('RETIRO_CON_TARJETA');
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const retry = useRef<{ signature: string; id: string } | null>(null);
  const availability = useAccountAvailability(bankAccountId);
  const amountProblem = monto.trim() ? validateCashAmountInput(monto) : null;
  const amount = monto.trim() && !amountProblem ? moneyInputToNumber(monto) : null;

  function reset() {
    setBankAccountId(null); setForma('RETIRO_CON_TARJETA'); setMonto(''); setReferencia(''); setError('');
    retry.current = null;
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!bankAccountId) { setError('Selecciona la cuenta de la que sale el efectivo.'); return; }
    const amountError = validateCashAmountInput(monto, 'Captura el monto retirado.');
    if (amountError) { setError(amountError); return; }
    if (!fitsAvailable(availability, moneyInputToNumber(monto))) { setError('Saldo insuficiente en la cuenta.'); return; }

    const data = { bankAccountId, forma, monto: moneyInputToNumber(monto) ?? 0, referencia: referencia.trim() || null, comprobanteUrl: null };
    const signature = JSON.stringify(data);
    if (retry.current?.signature !== signature) retry.current = { signature, id: crypto.randomUUID() };
    setError('');
    setBusy(true);
    try {
      await onSubmit({ ...data, requestId: retry.current.id });
      reset();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Retiro de efectivo para Caja General" onClose={close}>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <p className="text-sm text-slate-600">
            Beneficiario: <strong className="text-slate-900">Caja General</strong>. El retiro queda en tránsito hasta que
            la Jefa de Cajas reciba y cuente el efectivo; al confirmarlo entra a la caja y baja el saldo de la cuenta.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <BankAccountCombobox
              label="Cuenta de la que sale el efectivo"
              ariaLabel="Cuenta"
              accounts={accounts}
              value={bankAccountId}
              onChange={setBankAccountId}
              isLoading={isLoading}
              onlyActive
            />
            <label className="block text-sm font-medium text-slate-700">Forma de retiro
              <select aria-label="Forma de retiro" value={forma} onChange={event => setForma(event.target.value as WithdrawalMethod)} className={selectClass}>
                {Object.entries(WITHDRAWAL_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          {bankAccountId ? <AvailabilityHint availability={availability} amount={amount} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Monto
              <MoneyInput ariaLabel="Monto" value={monto} onChange={value => { setMonto(value); setError(''); }} className="mt-1" />
              <span className={`mt-1 block text-xs font-normal ${amountProblem ? 'text-red-600' : 'text-slate-500'}`}>
                {amountProblem ?? 'Se entrega en efectivo: centavos sólo .00 o .50.'}
              </span>
            </label>
            <label className="block text-sm font-medium text-slate-700">Referencia (opcional)
              <Input aria-label="Referencia" maxLength={300} placeholder="Número de cheque, operador…" value={referencia}
                onChange={event => setReferencia(event.target.value)} className="mt-1" />
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={close} className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <Button type="submit" isLoading={busy}>Registrar retiro</Button>
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
