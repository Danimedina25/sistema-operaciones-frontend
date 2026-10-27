import { ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { ReceiptViewerLink } from '@/shared/components/ui/ReceiptViewerLink';
import { Landmark, KeyRound, CheckCircle2, Clock3, UserRound, ShieldCheck, Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Modal } from '@/shared/components/ui/Modal';
import toast from 'react-hot-toast';
import { getReturnRequestSummary } from '../../api/operations.api';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import { Button } from '@/shared/components/ui/Button';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
import { api } from '@/shared/lib/axios';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { uploadOperationProof } from '../../api/operations-storage.api';
import { formatCurrency } from '../../utils/operation-formatters';
import type { ReturnPaymentResponse, ReturnInstallment } from '../../types/operations.types.ts';

export function CardlessCodePanel({ request, installments, onChanged, readOnly = false, legacyHistory, onClose, onBusyChange }: { request: ReturnPaymentResponse; installments: ReturnInstallment[]; onChanged?: () => void | Promise<void>; readOnly?: boolean; legacyHistory?: ReactNode; onClose?: () => void; onBusyChange?: (busy: boolean) => void }) {
  const { user } = useAuth();
  const formId = useId();
  const submitting = useRef(false);
  const roles = user?.roles ?? [];
  const accountsRole = !readOnly && roles.some(r => ['JEFA_CUENTAS','AUXILIAR_CUENTAS','ADMIN'].includes(r));
  const socio = !readOnly && roles.includes('SOCIO_COMERCIAL');
  const [account, setAccount] = useState<number | null>(null);
  const [editing, setEditing] = useState<ReturnInstallment | null>(null);
  const [editAccount, setEditAccount] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCode, setEditCode] = useState('');
  const [deleteWord, setDeleteWord] = useState('');
  const eligible = useQuery({ queryKey: ['cardless-accounts', request.id, editing?.id], enabled: accountsRole,
    queryFn: async () => (await api.get<{ data: BankAccountResponse[] }>(`/api/operations/returns/requests/${request.id}/cardless-accounts`, { params: editing ? { editingId: editing.id } : {} })).data.data });
  const accounts = eligible.data ?? [];
  const isLoading = eligible.isLoading;
  useEffect(() => {
    if (!editing && eligible.data && account !== null && !eligible.data.some(a => a.id === account)) setAccount(null);
  }, [editing, eligible.data, account]);
  const client = useQueryClient();
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { onBusyChange?.(saving); }, [saving, onBusyChange]);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [useTarget, setUseTarget] = useState<ReturnInstallment | null>(null);
  const useTrigger = useRef<HTMLButtonElement | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const historyRef = useRef<HTMLHeadingElement>(null);
  const [historyScroll, setHistoryScroll] = useState(0);
  useEffect(() => {
    if (!historyScroll || !historyRef.current) return;
    historyRef.current.style.scrollMarginTop = `${(summaryRef.current?.getBoundingClientRect().height ?? 0) + 16}px`;
    historyRef.current.focus({ preventScroll: true });
    historyRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [historyScroll]);
  const available = request.montoDisponible ?? request.monto;
  const numeric = Number(amount);
  const excess = numeric > available;
  async function run(action: () => Promise<unknown>, registration = false) {
    if (submitting.current) return false;
    submitting.current = true;
    setSaving(true); setError('');
    let registered = false;
    const successMessage = 'Código registrado y notificado al socio comercial.';
    try {
      await action(); registered = registration; setAmount(''); setCode(''); setConfirming(null); setCancelling(null); setProof(null);
      await Promise.all(['operation-returns','return-operation','return-request-summary','cardless-work','bank-work','cash-work','bank-accounts','cardless-accounts','general-cut','staff-work-operations'].map(key => client.invalidateQueries({ queryKey: [key] })));
      await onChanged?.();
      if (registration) {
        const updated = await client.fetchQuery({ queryKey: ['return-request-summary', request.id], queryFn: () => getReturnRequestSummary(request.id), staleTime: Infinity });
        toast.success(successMessage, { duration: 6000 });
        if (updated.solicitud.montoDisponible === 0) onClose?.();
        else setHistoryScroll(current => current + 1);
      }
      return true;
    } catch (e) {
      if (registered) {
        toast.success(successMessage, { duration: 6000 });
        setError('El código se registró, pero no se pudo actualizar la vista. Recarga antes de registrar otro código.');
      } else setError(getApiErrorMessage(e));
      return false;
    }
    finally { submitting.current = false; setSaving(false); }
  }
  return <div className="space-y-5">
    <section ref={summaryRef} className={`sticky top-0 z-10 space-y-3 rounded-2xl border bg-white p-4 shadow-lg ${error || excess ? 'border-red-300' : 'border-slate-200'}`}>
      <p className="text-sm text-slate-600">Solicitud #{request.id} · Operación #{request.operationId}{request.clienteNombre ? ` · ${request.clienteNombre}` : ''}</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-800">Solicitado<strong className="block">{formatCurrency(request.montoSolicitado ?? request.monto)}</strong></div>
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">Códigos registrados<strong className="block">{formatCurrency((request.montoSolicitado ?? request.monto) - available)}</strong></div>
        <div className="rounded-xl bg-amber-50 p-3 text-amber-900">Por registrar<strong className="block">{formatCurrency(available)}</strong></div>
      </div>
      {(error || excess) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error || `El código no puede superar ${formatCurrency(available)}.`}</p>}
    </section>
    {accountsRole && available > 0 && <form id={formId} className="space-y-4 rounded-2xl border border-slate-200 p-4" onSubmit={e => {
      e.preventDefault(); if (!account || !accounts.some(a => a.id === account) || eligible.isError || !code.trim() || !(numeric > 0) || excess) return;
      void run(() => api.post(`/api/operations/returns/requests/${request.id}/installments`, { monto: numeric, cuentaOrigenId: account, codigoRetiroSinTarjeta: code.trim() }), true);
    }}>
      <h3 className="font-semibold">Registrar código de retiro</h3>
      <p className="text-sm text-slate-500">Registra el código generado en el banco para que el socio lo comparta con el cliente. El importe queda reservado hasta verificar su cobro.</p>
      <BankAccountCombobox accounts={accounts} value={account} onChange={setAccount} label="Cuenta bancaria origen" isLoading={isLoading} disabled={saving || eligible.isError} />
      <p className="text-sm text-slate-500">Solo se muestran cuentas con saldo disponible para cubrir los {formatCurrency(available)} pendientes, descontando reservas.</p>
      {eligible.isError && <p role="alert" className="text-sm text-red-700">No se pudieron cargar las cuentas disponibles.</p>}
      {!isLoading && !eligible.isError && accounts.length === 0 && <p className="text-sm text-amber-800">No hay cuentas con saldo suficiente para cubrir lo pendiente.</p>}
      <label className="block text-sm font-medium">Monto del código<input disabled={saving} aria-label="Monto del código" type="number" min="0.01" step="0.01" max={available} value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
      {numeric > 0 && !excess && <p className="text-sm text-blue-800">{numeric === (request.montoSolicitado ?? request.monto) ? 'Monto completo solicitado.' : numeric === available ? 'Parcialidad de la solicitud. Completa el saldo pendiente.' : `Parcialidad. Quedarán ${formatCurrency(available - numeric)} por registrar.`}</p>}
      <label className="block text-sm font-medium">Código o referencia del banco<input disabled={saving} aria-label="Código o referencia del banco" value={code} maxLength={40} onChange={e => setCode(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
      <ActionDrawerFooter><div className="flex flex-wrap justify-end gap-3">
        {onClose && <Button type="button" variant="neutral" disabled={saving} onClick={onClose}>Cancelar</Button>}
      <Button type="submit" form={formId} className="min-w-0 flex-1" disabled={!account || !accounts.some(a => a.id === account) || eligible.isError || !code.trim() || !(numeric > 0) || excess || saving}>Registrar y notificar al socio</Button>
      </div></ActionDrawerFooter>
    </form>}
    <h3 ref={historyRef} tabIndex={-1} className="font-semibold outline-none">Códigos de esta solicitud</h3>
    {installments.filter(i => i.codigoParaCliente).map(i => <section key={i.id} aria-label={`Código de retiro #${i.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">Código #{i.id}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-950">{formatCurrency(i.monto)}</p>
          <p className="mt-1 text-xs text-slate-500">{i.monto === (request.montoSolicitado ?? request.monto) ? 'Monto completo solicitado' : 'Parcialidad de la solicitud'}</p>
        </div>
        <StatusBadge tone={i.estatus === 'CANCELADA' ? 'neutral' : i.confirmadoPorSocio && i.fechaCobroBancario ? 'success' : 'pending'} className="gap-1.5">
          {i.estatus === 'CANCELADA' ? <Trash2 size={13} aria-hidden="true" /> : i.confirmadoPorSocio && i.fechaCobroBancario ? <CheckCircle2 size={13} aria-hidden="true" /> : <Clock3 size={13} aria-hidden="true" />}
          {i.estatus === 'CANCELADA' ? 'Cancelado' : i.confirmadoPorSocio && i.fechaCobroBancario ? 'Concluido' : i.fechaCobroBancario ? 'Falta confirmación del socio' : i.confirmadoPorSocio ? 'Por verificar cobro' : 'Saldo reservado'}
        </StatusBadge>
      </div>
      <div className="space-y-4 p-5">
      <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <Landmark size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
        <div className="min-w-0"><p className="text-xs font-medium text-slate-500">Cuenta origen</p><p className="mt-1 break-words font-medium leading-relaxed text-slate-800">{i.cuentaOrigenNombre}</p></div>
      </div>
      <div className={`rounded-xl border p-4 ${i.estatus === 'CANCELADA' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-blue-100 bg-blue-50 text-blue-950'}`}>
        <p className="flex items-center gap-2 text-xs font-medium"><KeyRound size={15} aria-hidden="true" />Código de retiro</p>
        <p className="mt-2 break-all font-mono text-xl font-bold tracking-wider">{i.codigoRetiroSinTarjeta}</p>
      </div>
      {i.estatus !== 'CANCELADA' ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={`space-y-2 rounded-xl border p-3 ${i.confirmadoPorSocio ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-200'}`}>
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-600"><UserRound size={15} aria-hidden="true" />Socio comercial</p>
          <StatusBadge tone={i.confirmadoPorSocio ? 'success' : 'pending'}>{i.confirmadoPorSocio ? 'Uso reportado' : 'Por confirmar uso'}</StatusBadge>
        </div>
        <div className={`space-y-2 rounded-xl border p-3 ${i.fechaCobroBancario ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-200'}`}>
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-600"><ShieldCheck size={15} aria-hidden="true" />Cuentas</p>
          <StatusBadge tone={i.fechaCobroBancario ? 'success' : 'pending'}>{i.fechaCobroBancario ? 'Cobro confirmado' : 'Por verificar cobro'}</StatusBadge>
        </div>
      </div> : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Código cancelado sin uso. La reserva fue liberada.</p>}
      {i.comprobanteUrl && <ReceiptViewerLink className="text-blue-600 underline" href={i.comprobanteUrl}>Ver comprobante bancario</ReceiptViewerLink>}
      {i.estatus !== 'CANCELADA' && <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
        {socio && !i.confirmadoPorSocio && <Button disabled={saving} onClick={event => { useTrigger.current = event.currentTarget; event.currentTarget.focus(); setError(''); setUseTarget(i); }}>Marcar como utilizado</Button>}
        {accountsRole && !i.fechaCobroBancario && <Button disabled={saving} onClick={() => setConfirming(i.id)}>Confirmar cobro bancario</Button>}
        {accountsRole && !i.fechaCobroBancario && !i.confirmadoPorSocio && <div className="flex flex-wrap gap-2">
        <Button variant="neutral" className="text-red-600 hover:bg-red-50" disabled={saving} onClick={() => { setCancelling(i.id); setReason(''); setDeleteWord(''); setError(''); }}><Trash2 size={15} aria-hidden="true" />Eliminar código</Button>
        <Button variant="neutral" className="order-first" disabled={saving} onClick={() => { setEditing(i); setEditAccount(i.cuentaOrigenId ?? null); setEditAmount(String(i.monto)); setEditCode(i.codigoRetiroSinTarjeta ?? ''); setError(''); }}><Pencil size={15} aria-hidden="true" />Editar código</Button></div>}
      </div>}
      {confirming === i.id && <div className="space-y-3 rounded-xl bg-slate-50 p-3"><p>Confirma después de verificar en el banco que el código fue cobrado. Se descontará {formatCurrency(i.monto)} una sola vez.</p><ReceiptUploadField inputId={`code-proof-${i.id}`} label="Comprobante del cobro bancario" file={proof} onChange={setProof} /><Button disabled={!proof || saving} onClick={() => void run(async () => { if (!proof || !user?.userId) return; const uploaded = await uploadOperationProof({ file: proof, userId: user.userId, operationId: request.operationId }); await api.patch(`/api/operations/returns/installments/${i.id}/cardless-bank-confirm`, { comprobanteUrl: uploaded.downloadUrl }); })}>Confirmar y descontar del banco</Button></div>}

      </div>
    </section>)}
    {installments.some(i => !i.codigoParaCliente) && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Esta solicitud conserva parcialidades históricas del flujo de efectivo. Su contabilidad y confirmaciones anteriores no cambian.</p>}
    {legacyHistory}
    {!installments.some(i => i.codigoParaCliente) && <p className="text-sm text-slate-500">Aún no se han registrado códigos para el cliente.</p>}
    {(editing || cancelling !== null) && <>
      <Modal open busy={saving} variant="light" title={editing ? 'Editar código de retiro' : 'Eliminar código de retiro'} onClose={() => { if (!saving) { setEditing(null); setCancelling(null); } }} footer={<>
        <Button variant="neutral" disabled={saving} onClick={() => { setEditing(null); setCancelling(null); }}>Cancelar</Button>
        <Button disabled={saving || (editing ? !editAccount || !editCode.trim() || !(Number(editAmount) > 0) || Number(editAmount) > available + editing.monto : deleteWord !== 'ELIMINAR' || !reason.trim())} onClick={async () => {
          const success = await run(() => editing ? api.patch(`/api/operations/returns/installments/${editing.id}/cardless-code`, { monto: Number(editAmount), cuentaOrigenId: editAccount, codigoRetiroSinTarjeta: editCode.trim() }) : api.patch(`/api/operations/returns/installments/${cancelling}/cancel`, { motivo: reason.trim() }));
          if (success) { toast.success(editing ? 'Código actualizado y notificado al socio.' : 'Código eliminado. Reserva liberada.'); setEditing(null); setCancelling(null); }
        }}>{editing ? 'Guardar cambios' : 'Eliminar código'}</Button>
      </>}>
        <div className="space-y-4">
          {editing ? <>
            <BankAccountCombobox accounts={accounts} value={editAccount} onChange={setEditAccount} label="Cuenta bancaria origen" isLoading={isLoading} disabled={saving} />
            <label className="block text-sm">Monto del código<input disabled={saving} aria-label="Editar monto del código" type="number" min="0.01" step="0.01" max={available + editing.monto} value={editAmount} onChange={e => setEditAmount(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
            <label className="block text-sm">Código de retiro<input disabled={saving} aria-label="Editar código de retiro" maxLength={40} value={editCode} onChange={e => setEditCode(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
          </> : <>
            <p>Verifica en el banco que el código fue cancelado o venció sin uso. Se liberará su reserva y se conservará el historial.</p>
            <label className="block text-sm">Verificación bancaria y motivo<textarea disabled={saving} value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
            <label className="block text-sm">Escribe ELIMINAR para confirmar<input disabled={saving} value={deleteWord} onChange={e => setDeleteWord(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
          </>}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
        </div>
      </Modal>
    </>}
    {useTarget && <>
      <Modal open busy={saving} size="compact" title="Confirmar uso del código" variant="light" onClose={() => { if (!saving) { setUseTarget(null); useTrigger.current?.focus(); } }} footer={<>
        <Button variant="neutral" autoFocus disabled={saving} onClick={() => { setUseTarget(null); useTrigger.current?.focus(); }}>Cancelar</Button>
        <Button disabled={saving} isLoading={saving} onClick={async () => {
          const target = useTarget;
          const success = await run(() => api.patch(`/api/operations/returns/installments/${target.id}/confirm`));
          if (success) { setUseTarget(null); useTrigger.current?.focus(); }
        }}>Marcar como utilizado</Button>
      </>}>
        <div className="space-y-4">
          <p className="text-sm text-slate-700">¿Confirmas que el cliente ya utilizó este código de retiro?</p>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-950"><p className="text-sm">Código #{useTarget.id} · Solicitud #{request.id}</p><p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(useTarget.monto)}</p><p className="mt-3 text-sm">Código de retiro</p><p className="mt-1 break-all font-mono text-xl font-bold tracking-wide">{useTarget.codigoRetiroSinTarjeta}</p></div>
          <p className="text-sm text-slate-500">Se notificará a Cuentas para verificar el cobro bancario.</p>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>
      </Modal>
    </>}
  </div>;
}
