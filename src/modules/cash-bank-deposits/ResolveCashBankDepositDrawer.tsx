import { ReceiptViewerLink } from '@/shared/components/ui/ReceiptViewerLink';
import { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { Button } from '@/shared/components/ui/Button';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
import { formatMoney } from '@/shared/format';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { buildOperationDetailPath } from '@/routes/paths';
import { cashBankDepositsApi, type CashBankDeposit } from './api';

export type DepositResolution = 'confirm' | 'reject';

/**
 * Panel único para que Cuentas confirme o rechace un envío de Caja (efectivo o cheque).
 * Se usa desde la bandeja de envíos y desde el panel del cheque.
 */
export function ResolveCashBankDepositDrawer({ deposit, mode, onClose, onResolved }: {
  deposit: CashBankDeposit | null;
  mode: DepositResolution;
  onClose: () => void;
  onResolved?: () => void;
}) {
  const client = useQueryClient();
  const { user, hasRole } = useAuth();
  const canManage = hasRole(['JEFA_CUENTAS', 'ADMIN']);
  const [proof, setProof] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const formId = useId();
  const reasonId = useId();
  const errorId = useId();
  const submitting = useRef(false);
  const close = () => { if (!submitting.current) onClose(); };

  useEffect(() => { setProof(null); setReason(''); setError(''); }, [deposit?.id, mode]);

  async function submit() {
    if (!deposit || !user || !canManage || submitting.current) return;
    submitting.current = true;
    setBusy(true); setError('');
    try {
      if (mode === 'confirm') {
        if (!proof) { setError('Adjunta el comprobante bancario.'); return; }
        const uploaded = await uploadOperationProof(deposit.origen === 'CHEQUE' && deposit.operationId
          ? { file: proof, userId: user.userId, operationId: deposit.operationId }
          : { file: proof, userId: user.userId, folder: 'envios-caja-confirmados' });
        await cashBankDepositsApi.confirm(deposit.id, uploaded.downloadUrl);
      } else {
        if (!reason.trim()) { setError('Indica el motivo del rechazo.'); return; }
        await cashBankDepositsApi.reject(deposit.id, reason.trim());
      }
      toast.success(mode === 'confirm' ? 'Depósito bancario confirmado' : 'Envío rechazado');
      onResolved?.();
      onClose();
      await Promise.all([
        client.invalidateQueries({ queryKey: ['cash-bank-deposits'] }),
        client.invalidateQueries({ queryKey: ['caja-general'] }),
        client.invalidateQueries({ queryKey: ['bank-account-balance'] }),
        client.invalidateQueries({ queryKey: ['bank-movements'] }),
        client.invalidateQueries({ queryKey: ['general-cut'] }),
        client.invalidateQueries({ queryKey: ['bank-work'] }),
        client.invalidateQueries({ queryKey: ['cash-work'] }),
        client.invalidateQueries({ queryKey: ['cheques'] }),
        client.invalidateQueries({ queryKey: ['operations'] }),
      ]);
    } catch (caught) { setError(getApiErrorMessage(caught)); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <ActionDrawer open={!!deposit} title={mode === 'confirm' ? 'Confirmar depósito bancario' : 'Rechazar envío'}
    busy={busy} onClose={close}
    footer={<div className="flex flex-wrap items-center justify-end gap-3">
      <Button type="button" variant="neutral" disabled={busy} onClick={close}>Cancelar</Button>
      <Button type="submit" form={formId} variant={mode === 'confirm' ? 'success' : 'destructive'}
        isLoading={busy} className="min-w-0 flex-1 sm:flex-none">{mode === 'confirm' ? 'Confirmar depósito' : 'Rechazar envío'}</Button>
    </div>}>
    {deposit && <form id={formId} onSubmit={event => { event.preventDefault(); void submit(); }} className="space-y-5" aria-describedby={error ? errorId : undefined}>
      <FinancialSummaryCard label="Resumen del envío" className={error ? 'border-red-300' : ''}
        metrics={[{ label: 'Monto del depósito', value: formatMoney(deposit.monto), tone: 'blue' }]}>
        {/* El error conserva su id: el formulario y el motivo lo referencian con aria-describedby. */}
        {error && <p id={errorId} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </FinancialSummaryCard>
      <dl className="grid min-w-0 grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div className="min-w-0 sm:col-span-2"><dt className="text-slate-500">Cuenta destino</dt><dd className="mt-1 break-words font-semibold text-slate-900">{deposit.cuenta}</dd></div>
        <div className="min-w-0 sm:col-span-2"><dt className="text-slate-500">Titular de la cuenta</dt><dd className="mt-1 break-words font-semibold text-slate-900">{deposit.cuentaTitular}</dd></div>
        <div><dt className="text-slate-500">Origen</dt><dd className="mt-1 text-slate-900">{deposit.origen === 'CHEQUE' ? 'Cheque' : 'Caja General · efectivo'}</dd></div>
        <div className="min-w-0"><dt className="text-slate-500">{deposit.origen === 'CHEQUE' ? 'Número de cheque' : 'Referencia'}</dt><dd className="mt-1 break-words text-slate-900">{deposit.origen === 'CHEQUE' ? deposit.numeroCheque ?? 'No disponible' : deposit.referencia ?? '—'}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <ReceiptViewerLink href={deposit.comprobanteSalidaUrl} className="font-semibold text-brand hover:underline">Ver comprobante {deposit.origen === 'CHEQUE' ? 'de envío del cheque' : 'de salida'}</ReceiptViewerLink>
        {deposit.operationId && <Link className="font-semibold text-brand hover:underline" to={buildOperationDetailPath(deposit.operationId)}>Ver operación #{deposit.operationId}</Link>}
      </div>
      <fieldset disabled={busy} className="min-w-0 border-t border-slate-200 pt-5">
        <legend className="sr-only">{mode === 'confirm' ? 'Evidencia bancaria' : 'Motivo del rechazo'}</legend>
        {mode === 'confirm' ? <>
          <ReceiptUploadField file={proof} disabled={busy} onChange={file => { setProof(file); setError(''); }} label="Comprobante bancario" maxBytes={5_242_880} />
          <p className="mt-2 text-xs text-slate-500">Obligatorio para confirmar el depósito.</p>
        </> : <>
          <label htmlFor={reasonId} className="block text-sm font-semibold text-slate-700">Motivo del rechazo</label>
          <textarea id={reasonId} value={reason} onChange={event => { setReason(event.target.value); setError(''); }} maxLength={500}
            aria-invalid={!!error || undefined} aria-describedby={error ? errorId : undefined}
            className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
        </>}
      </fieldset>
    </form>}
  </ActionDrawer>;
}
