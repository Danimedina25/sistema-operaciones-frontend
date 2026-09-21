import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { cajaGeneralApi } from '@/modules/caja-general/api/caja-general.api';
import { DenominationFields } from '@/modules/caja-general/components/DenominationFields';
import { emptyCounts, currency } from '@/modules/caja-general/utils/cash-amounts';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { getBankAccounts } from '@/modules/bank-accounts/api/bank-accounts.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { buildOperationDetailPath } from '@/routes/paths';
import { chequesApi } from './api';
import { actionLabels, chequeLabels, type Cheque, type ChequeAction, type ChequeCommand } from './types';
import { allowedChequeActions, validateChequeCommand } from './rules';
import { BankAccountSelect } from './BankAccountSelect';

export function ChequeManager({ paymentId, onClose, onChanged }: { paymentId: number; onClose: () => void; onChanged?: () => void | Promise<void> }) {
  const cheque = useQuery({ queryKey: ['cheques', 'payment', paymentId], queryFn: () => chequesApi.byPayment(paymentId), retry: false });
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label="Gestionar cheque">
    <div className="w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl">
      <button type="button" onClick={onClose} className="mb-4 rounded border px-4 py-2">Cerrar</button>
      <h2 className="text-xl font-semibold">Gestionar cheque</h2>
      {cheque.isPending && <p>Cargando cheque…</p>}
      {cheque.isError && <div role="alert"><p>No se pudo consultar el cheque. {getApiErrorMessage(cheque.error)}</p><button onClick={() => void cheque.refetch()}>Reintentar</button></div>}
      {cheque.data && <ChequeDetail key={`${cheque.data.id}-${cheque.data.version}`} cheque={cheque.data} onChanged={onChanged} />}
    </div>
  </div>;
}
function ChequeDetail({ cheque, onChanged }: { cheque: Cheque; onChanged?: () => void | Promise<void> }) {
  const { hasRole, user } = useAuth();
  const client = useQueryClient();
  const allowed = allowedChequeActions(cheque, hasRole);
  const [action, setAction] = useState<ChequeAction | ''>('');
  const [account, setAccount] = useState<number | null>(cheque.cuentaDestinoId);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [counts, setCounts] = useState(emptyCounts);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  // Preserve exactly the same command and idempotency key after an uncertain response.
  const pendingCommand = useRef<ChequeCommand | null>(null);
  const submitting = useRef(false);
  const cash = useQuery({ queryKey: ['caja-general', user?.userId, 'latest'], queryFn: cajaGeneralApi.latest, enabled: action === 'COBRAR_EFECTIVO' });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!action || !user?.userId) throw new Error('Selecciona una acción.');
      if (!pendingCommand.current) {
        const command: ChequeCommand = { requestId: crypto.randomUUID(), version: cheque.version, accion: action, fecha: date,
          ...(['DEPOSITAR', 'COBRAR_BANCO'].includes(action) && account ? { cuentaDestinoId: account } : {}),
          ...(['DEVOLVER', 'CANCELAR'].includes(action) ? { motivo: reason.trim() } : { comprobanteUrl: file ? 'pending-upload' : undefined }),
          ...(action === 'COBRAR_EFECTIVO' ? { diaCajaId: cash.data && !cash.data.closedAt ? cash.data.id : undefined, denominaciones: counts } : {}),
        };
        const issue = validateChequeCommand(cheque, command, allowed);
        if (issue) throw new Error(issue);
        if (command.cuentaDestinoId) {
          const accounts = await getBankAccounts();
          if (!accounts.some(a => a.id === command.cuentaDestinoId && a.activo)) throw new Error('Selecciona una cuenta bancaria activa.');
        }
        if (file && !['DEVOLVER', 'CANCELAR'].includes(action)) {
          command.comprobanteUrl = (await uploadOperationProof({ file, userId: user.userId, operationId: cheque.operacionId })).downloadUrl;
        }
        pendingCommand.current = command;
      }
      return chequesApi.command(cheque.id, pendingCommand.current);
    },
    onSuccess: async (updated) => {
      setCompleted(true);
      client.setQueryData(['cheques', 'payment', cheque.pagoId], updated);
      await client.invalidateQueries();
      window.dispatchEvent(new CustomEvent('cheque-updated', { detail: { operationId: cheque.operacionId } }));
      await onChanged?.();
    },
    onError: e => setError(getApiErrorMessage(e)),
  });
  const locked = mutation.isPending || pendingCommand.current !== null || completed;
  return <div className="mt-4 space-y-4">
    <p className="font-semibold">{cheque.numeroCheque || 'Sin número'} · {currency(cheque.monto)} {cheque.moneda}</p>
    <p>{cheque.estado ? chequeLabels[cheque.estado] : 'Pendiente de conciliación'}</p>
    <dl className="grid grid-cols-2 gap-2 text-sm">
      <dt>Cliente</dt><dd>{cheque.clienteNombre}</dd><dt>Banco emisor</dt><dd>{cheque.bancoEmisor}</dd>
      <dt>Emisor</dt><dd>{cheque.emisor}</dd><dt>Beneficiario</dt><dd>{cheque.beneficiario}</dd>
      <dt>Fecha de recepción</dt><dd>{cheque.fechaRecepcion}</dd><dt>Destino</dt><dd>{cheque.destinoCobro === 'EFECTIVO' ? 'Caja General' : cheque.cuentaDestinoEtiqueta ?? 'Por definir'}</dd>
    </dl>
    <div className="flex gap-4 text-blue-700"><Link to={buildOperationDetailPath(cheque.operacionId)}>Ver operación #{cheque.operacionId}</Link><a href={cheque.comprobanteUrl} target="_blank" rel="noreferrer">Ver cheque</a></div>
    {cheque.requiereConciliacion && <p role="alert">Este cheque histórico requiere conciliación antes de registrar movimientos.</p>}
    {allowed.length > 0 && !completed && <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (submitting.current) return; submitting.current = true; setError(''); try { await mutation.mutateAsync(); } catch { /* rendered by onError */ } finally { submitting.current = false; } }}>
      <fieldset disabled={locked} className="space-y-4 disabled:opacity-60">
        <label className="block">Acción<select className="block w-full rounded border p-2" value={action} onChange={e => { setAction(e.target.value as ChequeAction); setError(''); }} required><option value="">Selecciona una acción</option>{allowed.map(a => <option key={a} value={a}>{actionLabels[a]}</option>)}</select></label>
        {action && <>
          <label className="block">Fecha efectiva<input className="block w-full rounded border p-2" type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
          {['DEPOSITAR', 'COBRAR_BANCO'].includes(action) && <BankAccountSelect value={account} onChange={setAccount} disabled={locked} historicalLabel={cheque.cuentaDestinoEtiqueta} />}
          {action === 'DEPOSITAR' && <p>El depósito quedará en compensación y no aumentará el saldo disponible.</p>}
          {action === 'COBRAR_BANCO' && <p>Confirma únicamente cuando el banco haya acreditado los recursos.</p>}
          {action === 'COBRAR_EFECTIVO' && <>
            <p>Registra el efectivo recibido en Caja General. No se retirarán fondos de una cuenta propia.</p>
            {cash.isPending ? <p>Consultando caja…</p> : cash.isError ? <p role="alert">No se pudo consultar Caja General. <button type="button" onClick={() => void cash.refetch()}>Reintentar</button></p> : !cash.data || cash.data.closedAt ? <p role="alert">Debes abrir Caja General antes de recibir el efectivo.</p> : <p>Caja abierta: {cash.data.fecha}</p>}
            <DenominationFields value={counts} onChange={setCounts} disabled={locked} />
          </>}
          {['DEVOLVER', 'CANCELAR'].includes(action) ? <label className="block">Motivo<textarea className="block w-full rounded border p-2" required value={reason} onChange={e => setReason(e.target.value)} /></label> : <label className="block">Comprobante<input className="block w-full" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>}
        </>}
      </fieldset>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {pendingCommand.current && error && <p>La solicitud conserva sus datos para reintentar sin duplicar el movimiento. Consulta el estado actualizado antes de iniciar otra acción.</p>}
      <button type="submit" disabled={!action || mutation.isPending || (action === 'COBRAR_EFECTIVO' && (cash.isPending || cash.isError || !cash.data || !!cash.data.closedAt))} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">{mutation.isPending ? 'Guardando…' : pendingCommand.current ? 'Reintentar solicitud' : 'Confirmar acción'}</button>
    </form>}
    {completed && <p role="status">Acción registrada.</p>}
    <h3 className="font-semibold">Historial</h3>
    {cheque.historial.length === 0 && <p>Sin movimientos registrados.</p>}
    <ul className="space-y-3">{cheque.historial.map(h => <li key={h.id} className="rounded border p-3 text-sm"><p>{h.accion} · {h.fecha}</p><p>{h.usuarioNombre}</p>{h.motivo && <p>{h.motivo}</p>}{h.comprobanteUrl && <a className="text-blue-700" href={h.comprobanteUrl} target="_blank" rel="noreferrer">Ver comprobante</a>}</li>)}</ul>
  </div>;
}
