import { ReceiptViewerLink } from '@/shared/components/ui/ReceiptViewerLink';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import { useAuth } from '@/modules/auth/store/auth.context';
import { CompactDenominationTables } from '@/modules/caja-general/components/CompactDenominationTables';
import { countCents, currency, emptyCounts } from '@/modules/caja-general/utils/cash-amounts';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { cashBankDepositsApi, depositMethodLabel, type CashBankDeposit, type DepositMethod } from './api';

const inputClass = 'mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-blue-500';

function SavedProofPreview({ url }: { url: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isPdf = decodeURIComponent(url).toLowerCase().includes('.pdf');
  return <section aria-label="Comprobante guardado" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h3 className="text-sm font-semibold text-slate-900">Comprobante guardado</h3>
    {!isPdf && !imageFailed
      ? <ReceiptViewerLink href={url} className="mt-3 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img src={url} alt="Miniatura del comprobante guardado" onError={() => setImageFailed(true)} className="h-44 w-full object-contain" />
        </ReceiptViewerLink>
      : <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{isPdf ? 'Comprobante en PDF' : 'No se pudo mostrar la miniatura.'}</p>}
    <ReceiptViewerLink href={url} className="mt-3 inline-block text-sm font-semibold text-blue-600 underline">Abrir comprobante completo</ReceiptViewerLink>
  </section>;
}

export function EditCashBankDepositModal({ deposit, accounts, onClose, onSaved }: {
  deposit: CashBankDeposit;
  accounts: BankAccountResponse[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { user } = useAuth();
  const formId = useId();
  const summaryRef = useRef<HTMLElement>(null);
  const submitting = useRef(false);
  const [accountId, setAccountId] = useState<number | null>(deposit.bankAccountId);
  const [method, setMethod] = useState<DepositMethod>(deposit.forma as DepositMethod);
  const [amount, setAmount] = useState(String(deposit.monto));
  const [reference, setReference] = useState(deposit.referencia ?? '');
  const hasEditableDetails = deposit.denominaciones != null && Number.isInteger(deposit.version);
  const [counts, setCounts] = useState(deposit.denominaciones ?? emptyCounts());
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (error) summaryRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); }, [error]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!hasEditableDetails || !accountId || !user || !/^\d{1,13}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const proofUrl = proof
        ? (await uploadOperationProof({ file: proof, userId: user.userId, folder: 'envios-caja' })).downloadUrl
        : deposit.comprobanteSalidaUrl;
      await cashBankDepositsApi.edit(deposit.id, {
        version: deposit.version, bankAccountId: accountId, monto: Number(amount), forma: method,
        referencia: reference.trim() || null, comprobanteSalidaUrl: proofUrl, denominaciones: counts,
      });
      await onSaved();
      onClose();
    } catch (caught) { setError(getApiErrorMessage(caught)); }
    finally { submitting.current = false; setBusy(false); }
  }

  const countedCents = countCents(counts);
  return <Modal open title={`Editar envío #${deposit.id}`} variant="light" size="wide" busy={busy} onClose={() => { if (!submitting.current) onClose(); }}
    footer={<>
      <Button type="button" variant="neutral" disabled={busy} onClick={onClose}>Cancelar</Button>
      <Button type="submit" form={formId} disabled={!hasEditableDetails || !accountId || busy} isLoading={busy}>Guardar cambios</Button>
    </>}>
    <form id={formId} onSubmit={submit} className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.96fr)_minmax(300px,1fr)] lg:items-start">
      <fieldset disabled={busy} className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div><h3 className="text-lg font-semibold text-slate-950">Datos del envío</h3>
          <p className="text-sm text-slate-500">Corrige la cuenta, el efectivo o el comprobante antes de la acreditación.</p></div>
        <BankAccountCombobox label="Cuenta bancaria destino" accounts={accounts} value={accountId} onChange={id => { setAccountId(id); setError(''); }}
          placeholder="Busca por banco, titular o número…" onlyActive clearSelectionOnInput />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Forma de envío
            <select className={inputClass} value={method} onChange={event => setMethod(event.target.value as DepositMethod)}>
              {Object.entries(depositMethodLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
          <label className="block text-sm font-medium text-slate-700">Monto
            <input className={inputClass} value={amount} onChange={event => { setAmount(event.target.value); setError(''); }} inputMode="decimal" required /></label>
        </div>
        <label className="block text-sm font-medium text-slate-700">Referencia (opcional)
          <input className={inputClass} value={reference} onChange={event => setReference(event.target.value)} maxLength={300} /></label>
        <div><h4 className="mb-3 text-sm font-semibold text-slate-900">Desglose del efectivo que sale</h4>
          <CompactDenominationTables value={counts} onChange={value => { setCounts(value); setError(''); }} dense /></div>
        <ReceiptUploadField file={proof} onChange={setProof} label="Reemplazar comprobante de salida" maxBytes={5_242_880} />
      </fieldset>
      <aside className="order-first min-w-0 lg:order-last space-y-4 lg:sticky lg:top-0 lg:self-start">
       <section ref={summaryRef} aria-label="Resumen del envío" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-slate-950">Resumen del envío</h3>
        <p className="mt-3 text-sm text-slate-500">Total contado</p>
        <p className="text-2xl font-bold tabular-nums text-slate-950">{Number.isFinite(countedCents) ? currency(countedCents / 100) : '—'}</p>
        {!hasEditableDetails && <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No pudimos cargar los datos completos del envío. Vuelve a abrirlo antes de editar para evitar perder información.</p>}
        <p className="mt-3 text-sm text-slate-600">El envío permanece en tránsito hasta que Cuentas confirme el depósito. Si no adjuntas otro comprobante, se conserva el actual.</p>
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

       </section>
       {deposit.comprobanteSalidaUrl && <SavedProofPreview url={deposit.comprobanteSalidaUrl} />}
      </aside>
    </form>
  </Modal>;
}
