import { ReceiptViewerLink } from '@/shared/components/ui/ReceiptViewerLink';
import { useId, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { cashWithdrawalsApi } from '@/modules/cash-withdrawals/api';
import { WITHDRAWAL_METHODS, type BankCashWithdrawal, type WithdrawalMethod } from '@/modules/cash-withdrawals/types';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import { Button } from '@/shared/components/ui/Button';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { MoneyInput } from '@/shared/components/ui/MoneyInput';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { moneyInputToNumber, validateCashAmountInput } from '@/shared/utils/money-input';

export function EditWithdrawalModal({ withdrawal, onClose, onSaved }: {
  withdrawal: BankCashWithdrawal;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { user } = useAuth();
  const formId = useId();
  const submitting = useRef(false);
  const { accounts, isLoading } = useBankAccounts();
  const [accountId, setAccountId] = useState<number | null>(withdrawal.bankAccountId);
  const [method, setMethod] = useState<WithdrawalMethod>(withdrawal.forma);
  const [amount, setAmount] = useState(String(withdrawal.monto));
  const [reference, setReference] = useState(withdrawal.referencia ?? '');
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !user) return;
    if (!accountId) { setError('Selecciona la cuenta de la que sale el efectivo.'); return; }
    const problem = validateCashAmountInput(amount, 'Captura el monto retirado.');
    if (problem) { setError(problem); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      const proofUrl = proof
        ? (await uploadOperationProof({ file: proof, userId: user.userId, folder: 'retiros-a-caja' })).downloadUrl
        : withdrawal.comprobanteUrl;
      await cashWithdrawalsApi.edit(withdrawal.id, {
        version: withdrawal.version, bankAccountId: accountId, forma: method,
        monto: moneyInputToNumber(amount) ?? 0, referencia: reference.trim() || null,
        comprobanteUrl: proofUrl,
      });
      await onSaved();
      onClose();
    } catch (caught) { setError(getApiErrorMessage(caught)); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <ActionDrawer open title={`Editar retiro #${withdrawal.id}`} busy={busy} onClose={() => { if (!submitting.current) onClose(); }}
    footer={<div className="flex flex-wrap justify-end gap-3">
      <Button type="button" variant="neutral" disabled={busy} onClick={onClose}>Cancelar</Button>
      <Button type="submit" form={formId} disabled={!accountId || busy} isLoading={busy}>Guardar cambios</Button>
    </div>}>
    <form id={formId} onSubmit={submit} className="space-y-5">
      <FinancialSummaryCard label="Resumen del retiro" errors={[error]}
        note={<>Destino: <strong>Caja General</strong>. Puedes editarlo hasta que Caja confirme su recepción.</>} />
      <fieldset disabled={busy} className="space-y-5">
        <BankAccountCombobox label="Cuenta de la que sale el efectivo" accounts={accounts} value={accountId}
          onChange={id => { setAccountId(id); setError(''); }} isLoading={isLoading} onlyActive clearSelectionOnInput />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Forma de retiro
            <select value={method} onChange={event => setMethod(event.target.value as WithdrawalMethod)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
              {Object.entries(WITHDRAWAL_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
          <label className="block text-sm font-medium text-slate-700">Monto
            <MoneyInput ariaLabel="Monto" value={amount} onChange={value => { setAmount(value); setError(''); }} className="mt-1" />
            <span className="mt-1 block text-xs font-normal text-slate-500">Se entrega en efectivo: centavos solo .00 o .50.</span>
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">Referencia (opcional)
          <input value={reference} onChange={event => setReference(event.target.value)} maxLength={300}
            className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" /></label>
        <ReceiptUploadField file={proof} onChange={setProof} label="Reemplazar comprobante (opcional)" maxBytes={5_242_880} />
        {withdrawal.comprobanteUrl && <ReceiptViewerLink href={withdrawal.comprobanteUrl} className="text-sm font-semibold text-blue-600 underline">Ver comprobante actual</ReceiptViewerLink>}
      </fieldset>
      <p className="text-xs text-slate-500">Si no adjuntas otro comprobante, se conserva el actual.</p>
    </form>
  </ActionDrawer>;
}
