import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { cajaGeneralApi } from '@/modules/caja-general/api/caja-general.api';
import { DenominationFields } from '@/modules/caja-general/components/DenominationFields';
import { emptyCounts, currency } from '@/modules/caja-general/utils/cash-amounts';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { getBankAccounts } from '@/modules/bank-accounts/api/bank-accounts.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { buildOperationDetailPath } from '@/routes/paths';
import { chequesApi } from './api';
import { actionLabels, chequeLabels, type Cheque, type ChequeAction, type ChequeCommand, type ChequeState } from './types';
import { allowedChequeActions, validateChequeCommand } from './rules';
import { BankAccountSelect } from './BankAccountSelect';

/** Mismos tokens que el cajón de revisión de comprobantes, para que el sistema se vea igual. */
const fieldLabel = 'mb-2 block text-sm font-medium text-slate-700';
const fieldControl = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60';
const noteBanner = 'rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700';
const alertBanner = 'rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700';
const linkStyle = 'text-xs font-medium text-blue-600 hover:underline';

const STATE_BADGE: Record<ChequeState, string> = {
  POR_COBRAR: 'border-amber-200 bg-amber-50 text-amber-700',
  DEPOSITADO: 'border-blue-200 bg-blue-50 text-blue-700',
  PENDIENTE_COBRO_EFECTIVO: 'border-violet-200 bg-violet-50 text-violet-700',
  COBRADO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DEVUELTO: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELADO: 'border-slate-200 bg-slate-100 text-slate-600',
};

export function ChequeManager({ paymentId, onClose, onChanged }: { paymentId: number; onClose: () => void; onChanged?: () => void | Promise<void> }) {
  const cheque = useQuery({ queryKey: ['cheques', 'payment', paymentId], queryFn: () => chequesApi.byPayment(paymentId), retry: false });
  const data = cheque.data;

  return <div className="fixed inset-0 z-50">
    <button
      type="button"
      aria-label="Cerrar gestión del cheque"
      onClick={onClose}
      className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
    />

    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gestionar cheque"
      className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl shadow-slate-950/20"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Gestionar cheque</p>
          <h4 className="mt-1 truncate text-lg font-semibold text-slate-900">
            {data ? `${data.numeroCheque || 'Sin número'} · ${currency(data.monto)} ${data.moneda}` : 'Cheque recibido'}
          </h4>
          {data ? (
            <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${data.estado ? STATE_BADGE[data.estado] : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
              {data.estado ? chequeLabels[data.estado] : 'Pendiente de conciliación'}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {cheque.isPending && <p className="text-sm text-slate-500">Cargando cheque…</p>}
        {cheque.isError && (
          <div role="alert" className={alertBanner}>
            <p>No se pudo consultar el cheque. {getApiErrorMessage(cheque.error)}</p>
            <button type="button" onClick={() => void cheque.refetch()} className="mt-1 font-semibold underline">Reintentar</button>
          </div>
        )}
        {data && <ChequeDetail key={`${data.id}-${data.version}`} cheque={data} onChanged={onChanged} />}
      </div>
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
  const cash = useQuery({ queryKey: ['caja-general', user?.userId, 'latest'], queryFn: cajaGeneralApi.latest, enabled: action === 'CONFIRMAR_COBRO_EFECTIVO' });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!action || !user?.userId) throw new Error('Selecciona una acción.');
      if (!pendingCommand.current) {
        const command: ChequeCommand = { requestId: crypto.randomUUID(), version: cheque.version, accion: action, fecha: date,
          ...(['DEPOSITAR', 'COBRAR_BANCO'].includes(action) && account ? { cuentaDestinoId: account } : {}),
          ...(['DEVOLVER', 'CANCELAR', 'DEVOLVER_A_CUENTAS', 'RETIRAR_COBRO_EFECTIVO'].includes(action) ? { motivo: reason.trim() } : {}),
          ...(action === 'ASIGNAR_COBRO_EFECTIVO' && reason.trim() ? { motivo: reason.trim() } : {}),
          ...(['DEPOSITAR', 'COBRAR_BANCO', 'CONFIRMAR_COBRO_EFECTIVO'].includes(action) ? { comprobanteUrl: file ? 'pending-upload' : undefined } : {}),
          ...(action === 'CONFIRMAR_COBRO_EFECTIVO' ? { diaCajaId: cash.data && !cash.data.closedAt ? cash.data.id : undefined, denominaciones: counts } : {}),
        };
        const issue = validateChequeCommand(cheque, command, allowed);
        if (issue) throw new Error(issue);
        if (command.cuentaDestinoId) {
          const accounts = await getBankAccounts();
          if (!accounts.some(a => a.id === command.cuentaDestinoId && a.activo)) throw new Error('Selecciona una cuenta bancaria activa.');
        }
        if (file && ['DEPOSITAR', 'COBRAR_BANCO', 'CONFIRMAR_COBRO_EFECTIVO'].includes(action)) {
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
  const requiresReason = ['DEVOLVER', 'CANCELAR', 'DEVOLVER_A_CUENTAS', 'RETIRAR_COBRO_EFECTIVO'].includes(action);
  const optionalReason = action === 'ASIGNAR_COBRO_EFECTIVO';
  const requiresProof = ['DEPOSITAR', 'COBRAR_BANCO', 'CONFIRMAR_COBRO_EFECTIVO'].includes(action);

  return <>
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p><span className="font-medium">Cliente:</span> {cheque.clienteNombre}</p>
      <p><span className="font-medium">Banco emisor:</span> {cheque.bancoEmisor}</p>
      <p><span className="font-medium">Emisor:</span> {cheque.emisor}</p>
      <p><span className="font-medium">Beneficiario:</span> {cheque.beneficiario}</p>
      <p><span className="font-medium">Fecha de recepción:</span> {cheque.fechaRecepcion}</p>
      <p><span className="font-medium">Destino:</span> {cheque.estado === 'PENDIENTE_COBRO_EFECTIVO' ? 'Caja General · pendiente de recepción' : cheque.destinoCobro === 'EFECTIVO' ? 'Caja General' : cheque.cuentaDestinoEtiqueta ?? 'Por definir'}</p>
    </div>

    <div className="flex flex-wrap gap-4">
      <Link to={buildOperationDetailPath(cheque.operacionId)} className={linkStyle}>Ver operación #{cheque.operacionId}</Link>
      <a href={cheque.comprobanteUrl} target="_blank" rel="noreferrer" className={linkStyle}>Ver cheque</a>
    </div>

    {cheque.requiereConciliacion && (
      <p role="alert" className={alertBanner}>Este cheque histórico requiere conciliación antes de registrar movimientos.</p>
    )}

    {allowed.length > 0 && !completed && <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (submitting.current) return; submitting.current = true; setError(''); try { await mutation.mutateAsync(); } catch { /* rendered by onError */ } finally { submitting.current = false; } }}>
      <fieldset disabled={locked} className="space-y-4">
        <div>
          <label htmlFor="cheque-action" className={fieldLabel}>Acción <span className="text-rose-600">*</span></label>
          <select id="cheque-action" className={fieldControl} value={action} onChange={e => { setAction(e.target.value as ChequeAction); setError(''); }} required>
            <option value="">Selecciona una acción</option>
            {allowed.map(a => <option key={a} value={a}>{actionLabels[a]}</option>)}
          </select>
        </div>

        {action && <>
          <div>
            <label htmlFor="cheque-date" className={fieldLabel}>Fecha efectiva <span className="text-rose-600">*</span></label>
            <input id="cheque-date" className={fieldControl} type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {['DEPOSITAR', 'COBRAR_BANCO'].includes(action) && <BankAccountSelect value={account} onChange={setAccount} disabled={locked} historicalLabel={cheque.cuentaDestinoEtiqueta} />}

          {action === 'DEPOSITAR' && <p className={noteBanner}>El depósito quedará en compensación y no aumentará el saldo disponible.</p>}
          {action === 'COBRAR_BANCO' && <p className={noteBanner}>Confirma únicamente cuando el banco haya acreditado los recursos.</p>}
          {action === 'ASIGNAR_COBRO_EFECTIVO' && <p className={noteBanner}>La responsabilidad pasará a la Jefa de Cajas. Esta acción no registra todavía un ingreso.</p>}
          {action === 'RETIRAR_COBRO_EFECTIVO' && <p className={noteBanner}>El cheque volverá a Cuentas para decidir un nuevo medio de cobro.</p>}
          {action === 'DEVOLVER_A_CUENTAS' && <p className={noteBanner}>El intento quedará en el historial y el cheque regresará a Cuentas; todavía podrá depositarse.</p>}

          {action === 'CONFIRMAR_COBRO_EFECTIVO' && <>
            <p className={noteBanner}>Registra el efectivo recibido en Caja General. No se retirarán fondos de una cuenta propia.</p>
            {cash.isPending ? <p className="text-sm text-slate-500">Consultando caja…</p>
              : cash.isError ? <p role="alert" className={alertBanner}>No se pudo consultar Caja General. <button type="button" onClick={() => void cash.refetch()} className="font-semibold underline">Reintentar</button></p>
                : !cash.data || cash.data.closedAt ? <p role="alert" className={alertBanner}>Debes abrir Caja General antes de recibir el efectivo.</p>
                  : <p className="text-sm text-slate-600">Caja abierta: {cash.data.fecha}</p>}
            <DenominationFields value={counts} onChange={setCounts} disabled={locked} />
          </>}

          {(requiresReason || optionalReason) && (
            <div>
              <label htmlFor="cheque-reason" className={fieldLabel}>{optionalReason ? 'Observación' : 'Motivo'} {requiresReason && <span className="text-rose-600">*</span>}</label>
              <textarea id="cheque-reason" rows={4} className={fieldControl} required={requiresReason} value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          )}
          {requiresProof && (
            <div>
              <label htmlFor="cheque-proof" className={fieldLabel}>Comprobante <span className="text-rose-600">*</span></label>
              <input id="cheque-proof" className={`${fieldControl} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700`} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
          )}
        </>}
      </fieldset>

      {error && <p role="alert" className={alertBanner}>{error}</p>}
      {pendingCommand.current && error && (
        <p className="text-xs text-slate-500">La solicitud conserva sus datos para reintentar sin duplicar el movimiento. Consulta el estado actualizado antes de iniciar otra acción.</p>
      )}

      <button
        type="submit"
        disabled={!action || mutation.isPending || (action === 'CONFIRMAR_COBRO_EFECTIVO' && (cash.isPending || cash.isError || !cash.data || !!cash.data.closedAt))}
        className={`inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${requiresReason ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
      >
        {mutation.isPending ? 'Guardando…' : pendingCommand.current ? 'Reintentar solicitud' : 'Confirmar acción'}
      </button>
    </form>}

    {completed && (
      <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">Acción registrada.</p>
    )}

    <div>
      <p className="text-sm font-semibold text-slate-700">Historial</p>
      {cheque.historial.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Sin movimientos registrados.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {cheque.historial.map(h => (
            <li key={h.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{h.accion} · {h.fecha}</p>
              <p className="text-xs text-slate-500">{h.usuarioNombre}</p>
              {h.motivo && <p className="mt-1 text-xs text-slate-600">{h.motivo}</p>}
              {h.comprobanteUrl && <a className={`${linkStyle} mt-1 inline-block`} href={h.comprobanteUrl} target="_blank" rel="noreferrer">Ver comprobante</a>}
            </li>
          ))}
        </ul>
      )}
    </div>
  </>;
}
