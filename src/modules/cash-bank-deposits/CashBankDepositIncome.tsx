import { ReceiptViewerLink } from '@/shared/components/ui/ReceiptViewerLink';
import { useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { Button } from '@/shared/components/ui/Button';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { formatDateTime, formatMoney } from '@/shared/format';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { buildOperationDetailPath } from '@/routes/paths';
import { cashBankDepositsApi, depositMethodLabel, type CashBankDeposit, type DepositMethod } from './api';

export function CashBankDepositIncome() {
  const client = useQueryClient();
  const { user, hasRole } = useAuth();
  const canManage = hasRole(['JEFA_CUENTAS', 'ADMIN']);
  const pending = useQuery({ queryKey: ['cash-bank-deposits', 'pending'], queryFn: cashBankDepositsApi.pending });
  const [selected, setSelected] = useState<CashBankDeposit | null>(null);
  const [mode, setMode] = useState<'confirm' | 'reject'>('confirm');
  const [proof, setProof] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const rows = pending.data ?? [];
  const formId = useId();
  const reasonId = useId();
  const errorId = useId();
  const submitting = useRef(false);
  const close = () => { if (!submitting.current) setSelected(null); };

  function open(row: CashBankDeposit, next: 'confirm' | 'reject') {
    setSelected(row); setMode(next); setProof(null); setReason(''); setError('');
  }
  async function submit() {
    if (!selected || !user || !canManage || submitting.current) return;
    submitting.current = true;
    setBusy(true); setError('');
    try {
      if (mode === 'confirm') {
        if (!proof) { setError('Adjunta el comprobante bancario.'); return; }
        const uploaded = await uploadOperationProof(selected.origen === 'CHEQUE' && selected.operationId
          ? { file: proof, userId: user.userId, operationId: selected.operationId }
          : { file: proof, userId: user.userId, folder: 'envios-caja-confirmados' });
        await cashBankDepositsApi.confirm(selected.id, uploaded.downloadUrl);
      } else {
        if (!reason.trim()) { setError('Indica el motivo del rechazo.'); return; }
        await cashBankDepositsApi.reject(selected.id, reason.trim());
      }
      setSelected(null);
      toast.success(mode === 'confirm' ? 'Depósito bancario confirmado' : 'Envío rechazado');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['cash-bank-deposits'] }),
        client.invalidateQueries({ queryKey: ['caja-general'] }),
        client.invalidateQueries({ queryKey: ['bank-account-balance'] }),
        client.invalidateQueries({ queryKey: ['bank-movements'] }),
        client.invalidateQueries({ queryKey: ['general-cut'] }),
        client.invalidateQueries({ queryKey: ['bank-work'] }),
        client.invalidateQueries({ queryKey: ['cash-work'] }),
        client.invalidateQueries({ queryKey: ['cheques'] }),
      ]);
    } catch (caught) { setError(getApiErrorMessage(caught)); }
    finally { submitting.current = false; setBusy(false); }
  }
  const columns: DataTableColumn<CashBankDeposit>[] = [
    { key: 'date', header: 'Registrado', width: '16%', cell: row => <span className="whitespace-nowrap">{formatDateTime(row.registradoEn)}</span> },
    { key: 'account', header: 'Cuenta destino', width: '22%', cell: row => <span className="block min-w-0" title={`${row.cuenta} · ${row.cuentaTitular}`}><strong className="block truncate">{row.cuenta}</strong><small className="block truncate text-slate-500">Titular: {row.cuentaTitular}</small><small className="block truncate text-slate-400">Envió: {row.registradoPorNombre}</small></span> },
    { key: 'method', header: 'Origen', width: '17%', cell: row => <span className="block truncate" title={row.origen === 'CHEQUE' ? `Cheque ${row.numeroCheque ?? ''}`.trim() : `Caja · ${depositMethodLabel[row.forma as DepositMethod] ?? row.forma}`}>
      {row.origen === 'CHEQUE' ? `Cheque ${row.numeroCheque ?? ''}`.trim() : `Caja · ${depositMethodLabel[row.forma as DepositMethod] ?? row.forma}`}
    </span> },
    { key: 'reference', header: 'Referencia', width: '13%', cell: row => <span className="block truncate" title={row.referencia ?? ''}>{row.referencia ?? '—'}</span> },
    { key: 'amount', header: 'Monto', width: '14%', align: 'right', cell: row => <strong className="whitespace-nowrap tabular-nums">{formatMoney(row.monto)}</strong> },
    { key: 'actions', header: '', kind: 'actions', width: '18%', cell: row => canManage
      ? <div className="flex justify-end gap-2"><Button type="button" variant="success" className="h-9 px-3 text-xs" onClick={() => open(row, 'confirm')}>Confirmar</Button>
          <button type="button" onClick={() => open(row, 'reject')} className="text-xs font-semibold text-red-600">Rechazar</button></div>
      : <span className="text-xs text-slate-500">Solo consulta</span> },
  ];
  return <div className="space-y-4">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {pending.isError && <p role="alert" className="px-5 pb-4 text-sm text-red-700">No se pudieron cargar los envíos.
        <button type="button" className="ml-2 underline" onClick={() => void pending.refetch()}>Reintentar</button></p>}
      {pending.isPending ? <p className="p-5 text-sm text-slate-500">Cargando envíos…</p> :
        <DataTable columns={columns} rows={rows} getRowKey={row => row.id}
          mobile={{ title: row => row.cuenta, subtitle: row => formatDateTime(row.registradoEn),
            fields: [{ key: 'holder', label: 'Titular de la cuenta', value: row => row.cuentaTitular },
              { key: 'origin', label: 'Origen', value: row => row.origen === 'CHEQUE' ? 'Cheque' : 'Caja General' },
              { key: 'reference', label: 'Referencia / cheque', value: row => row.numeroCheque ?? row.referencia ?? '—' },
              { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) }],
            actions: row => canManage ? <div className="flex gap-2">
              <Button variant="success" className="h-9 px-3 text-xs" onClick={() => open(row, 'confirm')}>Confirmar</Button>
              <Button variant="neutral" className="h-9 px-3 text-xs" onClick={() => open(row, 'reject')}>Rechazar</Button>
            </div> : null }}
          emptyTitle="Sin envíos por confirmar" emptyDescription="Los depósitos de efectivo y cheques pendientes aparecerán aquí." />}
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Confirma cuando el depósito aparezca en la cuenta. En un envío de efectivo baja Caja General; en un cheque se valida su pago sin mover efectivo. Si no llegó o no coincide, recházalo.</p>
    </section>
    <ActionDrawer open={!!selected} title={mode === 'confirm' ? 'Confirmar depósito bancario' : 'Rechazar envío'}
      busy={busy} onClose={close}
      footer={<div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="neutral" disabled={busy} onClick={close}>Cancelar</Button>
        <Button type="submit" form={formId} variant={mode === 'confirm' ? 'success' : 'destructive'}
          isLoading={busy} className="min-w-0 flex-1 sm:flex-none">{mode === 'confirm' ? 'Confirmar depósito' : 'Rechazar envío'}</Button>
      </div>}>
      {selected && <form id={formId} onSubmit={event => { event.preventDefault(); void submit(); }} className="space-y-5" aria-describedby={error ? errorId : undefined}>
        <FinancialSummaryCard label="Resumen del envío" className={error ? 'border-red-300' : ''}
          metrics={[{ label: 'Monto del depósito', value: formatMoney(selected.monto), tone: 'blue' }]}>
          {/* El error conserva su id: el formulario y el motivo lo referencian con aria-describedby. */}
          {error && <p id={errorId} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </FinancialSummaryCard>
        <dl className="grid min-w-0 grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="min-w-0 sm:col-span-2"><dt className="text-slate-500">Cuenta destino</dt><dd className="mt-1 break-words font-semibold text-slate-900">{selected.cuenta}</dd></div>
          <div className="min-w-0 sm:col-span-2"><dt className="text-slate-500">Titular de la cuenta</dt><dd className="mt-1 break-words font-semibold text-slate-900">{selected.cuentaTitular}</dd></div>
          <div><dt className="text-slate-500">Origen</dt><dd className="mt-1 text-slate-900">{selected.origen === 'CHEQUE' ? 'Cheque' : 'Caja General · efectivo'}</dd></div>
          <div className="min-w-0"><dt className="text-slate-500">{selected.origen === 'CHEQUE' ? 'Número de cheque' : 'Referencia'}</dt><dd className="mt-1 break-words text-slate-900">{selected.origen === 'CHEQUE' ? selected.numeroCheque ?? 'No disponible' : selected.referencia ?? '—'}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <ReceiptViewerLink href={selected.comprobanteSalidaUrl} className="font-semibold text-brand hover:underline">Ver comprobante {selected.origen === 'CHEQUE' ? 'de envío del cheque' : 'de salida'}</ReceiptViewerLink>
          {selected.operationId && <Link className="font-semibold text-brand hover:underline" to={buildOperationDetailPath(selected.operationId)}>Ver operación #{selected.operationId}</Link>}
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
    </ActionDrawer>
  </div>;
}
