import { ReceiptViewerLink } from '@/shared/components/ui/ReceiptViewerLink';
import { useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { ActionDrawer, ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { formatAccount, formatDate, formatDateTime } from '@/shared/format';
import { cajaGeneralApi } from '@/modules/caja-general/api/caja-general.api';
import { CompactDenominationTables } from '@/modules/caja-general/components/CompactDenominationTables';
import { checkCount, countCents, emptyCounts, currency } from '@/modules/caja-general/utils/cash-amounts';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { getBankAccounts } from '@/modules/bank-accounts/api/bank-accounts.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { buildOperationDetailPath } from '@/routes/paths';
import { chequesApi } from './api';
import { actionLabels, chequeLabels, type Cheque, type ChequeAction, type ChequeCommand, type ChequeState } from './types';
import { allowedChequeActions, validateChequeCommand } from './rules';
import { BankAccountSelect } from './BankAccountSelect';

/** Error de captura que se muestra tal cual en el resumen (no viene del servidor). */
class ChequeFormError extends Error {}

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

  return <ActionDrawer open ariaLabel="Gestionar cheque" eyebrow="Gestionar cheque"
    title={data ? `${data.numeroCheque || 'Sin número'} · ${currency(data.monto)} ${data.moneda}` : 'Cheque recibido'}
    onClose={onClose}>
    <div className="space-y-5">
      {cheque.isPending && <p className="text-sm text-slate-500">Cargando cheque…</p>}
      {cheque.isError && <div role="alert" className={alertBanner}>
        <p>No se pudo consultar el cheque. {getApiErrorMessage(cheque.error)}</p>
        <button type="button" onClick={() => void cheque.refetch()} className="mt-1 font-semibold underline">Reintentar</button>
      </div>}
      {data && <ChequeDetail key={`${data.id}-${data.version}`} cheque={data} onChanged={onChanged} />}
    </div>
  </ActionDrawer>;
}

function ChequeDetail({ cheque, onChanged }: { cheque: Cheque; onChanged?: () => void | Promise<void> }) {
  const formId = useId();
  const { hasRole, user } = useAuth();
  const client = useQueryClient();
  const allowed = allowedChequeActions(cheque, hasRole);
  const [action, setAction] = useState<ChequeAction | ''>('');
  const [account, setAccount] = useState<number | null>(cheque.cuentaDestinoId);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [counts, setCounts] = useState(emptyCounts);
  const countedCents = countCents(counts);
  const count = checkCount(countedCents, Math.round(cheque.monto * 100));
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  // Preserve exactly the same command and idempotency key after an uncertain response.
  const pendingCommand = useRef<ChequeCommand | null>(null);
  const submitting = useRef(false);
  const cash = useQuery({ queryKey: ['caja-general', user?.userId, 'latest'], queryFn: cajaGeneralApi.latest, enabled: action === 'CONFIRMAR_COBRO_EFECTIVO' });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!action || !user?.userId) throw new ChequeFormError('Selecciona una acción.');
      if (!pendingCommand.current) {
        const command: ChequeCommand = { requestId: crypto.randomUUID(), version: cheque.version, accion: action, fecha: date,
          ...(['DEPOSITAR', 'COBRAR_BANCO'].includes(action) && account ? { cuentaDestinoId: account } : {}),
          ...(['DEVOLVER', 'CANCELAR', 'DEVOLVER_A_CUENTAS', 'RETIRAR_COBRO_EFECTIVO'].includes(action) ? { motivo: reason.trim() } : {}),
          ...(action === 'ASIGNAR_COBRO_EFECTIVO' && reason.trim() ? { motivo: reason.trim() } : {}),
          ...(['DEPOSITAR', 'COBRAR_BANCO', 'CONFIRMAR_COBRO_EFECTIVO'].includes(action) ? { comprobanteUrl: file ? 'pending-upload' : undefined } : {}),
          ...(action === 'CONFIRMAR_COBRO_EFECTIVO' ? { diaCajaId: cash.data && !cash.data.closedAt ? cash.data.id : undefined, denominaciones: counts } : {}),
        };
        const issue = validateChequeCommand(cheque, command, allowed);
        if (issue) throw new ChequeFormError(issue);
        if (command.cuentaDestinoId) {
          const accounts = await getBankAccounts();
          if (!accounts.some(a => a.id === command.cuentaDestinoId && a.activo)) throw new ChequeFormError('Selecciona una cuenta bancaria activa.');
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
    onError: e => setError(e instanceof ChequeFormError ? e.message : getApiErrorMessage(e)),
  });
  const locked = mutation.isPending || pendingCommand.current !== null || completed;
  const requiresReason = ['DEVOLVER', 'CANCELAR', 'DEVOLVER_A_CUENTAS', 'RETIRAR_COBRO_EFECTIVO'].includes(action);
  const optionalReason = action === 'ASIGNAR_COBRO_EFECTIVO';
  const requiresProof = ['DEPOSITAR', 'COBRAR_BANCO', 'CONFIRMAR_COBRO_EFECTIVO'].includes(action);
  const choosesAccount = ['DEPOSITAR', 'COBRAR_BANCO'].includes(action);
  const confirmsCash = action === 'CONFIRMAR_COBRO_EFECTIVO';
  // Misma consulta (y caché) que BankAccountSelect: solo se usa para mostrar la cuenta elegida.
  const accounts = useQuery({ queryKey: ['cheque-bank-accounts'], queryFn: getBankAccounts, enabled: choosesAccount });
  const chosenAccount = accounts.data?.find(a => a.id === account);
  const accountLabel = chosenAccount ? formatAccount(chosenAccount.banco, chosenAccount.numeroCuenta) : account !== null ? cheque.cuentaDestinoEtiqueta : null;
  const cashClosed = confirmsCash && !cash.isPending && !cash.isError && (!cash.data || !!cash.data.closedAt);

  return <>
    <FinancialSummaryCard label="Resumen del cheque"
      context={<span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cheque.estado ? STATE_BADGE[cheque.estado] : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
        {cheque.estado ? chequeLabels[cheque.estado] : 'Pendiente de conciliación'}
      </span>}
      metrics={[{ label: 'Monto del cheque', value: `${currency(cheque.monto)} ${cheque.moneda}`, tone: 'blue' },
        ...(confirmsCash ? [{ label: 'Total contado', value: Number.isFinite(countedCents) ? currency(countedCents / 100) : '—', tone: count.tone }] : [])]}
      status={confirmsCash ? { text: count.text, tone: count.tone } : undefined}
      note={choosesAccount && accountLabel ? `Cuenta destino: ${accountLabel}` : undefined}
      errors={[cheque.requiereConciliacion && 'Este cheque histórico requiere conciliación antes de registrar movimientos.', cashClosed && 'Debes abrir Caja General antes de recibir el efectivo.', confirmsCash && count.error, error]}
      warnings={[pendingCommand.current && error && 'La solicitud conserva sus datos para reintentar sin duplicar el movimiento. Consulta el estado actualizado antes de iniciar otra acción.']}>
      {confirmsCash && cash.isError && <p role="alert" className={alertBanner}>No se pudo consultar Caja General. <button type="button" onClick={() => void cash.refetch()} className="font-semibold underline">Reintentar</button></p>}
    </FinancialSummaryCard>

    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p><span className="font-medium">Cliente:</span> {cheque.clienteNombre}</p>
      <p><span className="font-medium">Banco emisor:</span> {cheque.bancoEmisor}</p>
      <p><span className="font-medium">Emisor:</span> {cheque.emisor}</p>
      <p><span className="font-medium">Beneficiario:</span> {cheque.beneficiario}</p>
      <p><span className="font-medium">Fecha de recepción:</span> {formatDateTime(cheque.fechaRecepcion)}</p>
      <p><span className="font-medium">Destino:</span> {cheque.estado === 'PENDIENTE_COBRO_EFECTIVO' ? 'Caja General · pendiente de recepción' : cheque.destinoCobro === 'EFECTIVO' ? 'Caja General' : cheque.cuentaDestinoEtiqueta ?? 'Por definir'}</p>
    </div>

    <div className="flex flex-wrap gap-4">
      <Link to={buildOperationDetailPath(cheque.operacionId)} className={linkStyle}>Ver operación #{cheque.operacionId}</Link>
      <ReceiptViewerLink href={cheque.comprobanteUrl} className={linkStyle}>Ver cheque</ReceiptViewerLink>
    </div>

    {allowed.length > 0 && !completed && <form id={formId} noValidate className="space-y-4" onSubmit={async e => { e.preventDefault(); if (submitting.current) return; submitting.current = true; setError(''); try { await mutation.mutateAsync(); } catch { /* rendered by onError */ } finally { submitting.current = false; } }}>
      <fieldset disabled={locked} className="space-y-4">
        <div>
          <label htmlFor="cheque-action" className={fieldLabel}>Acción <span className="text-rose-600">*</span></label>
          <select id="cheque-action" className={fieldControl} value={action} onChange={e => { setAction(e.target.value as ChequeAction); setError(''); }} required>
            <option value="">Selecciona una acción</option>
            {allowed.map(a => <option key={a} value={a}>{cheque.estado === 'POR_COBRAR' && a === 'CONFIRMAR_COBRO_EFECTIVO' ? 'Se cobró en efectivo' : cheque.estado === 'POR_COBRAR' && a === 'DEPOSITAR' ? 'Se depositará en una cuenta bancaria' : actionLabels[a]}</option>)}
          </select>
        </div>

        {action && <>
          <div>
            <label htmlFor="cheque-date" className={fieldLabel}>Fecha efectiva <span className="text-rose-600">*</span></label>
            <input id="cheque-date" className={fieldControl} type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {['DEPOSITAR', 'COBRAR_BANCO'].includes(action) && <BankAccountSelect value={account} onChange={setAccount} disabled={locked} historicalLabel={cheque.cuentaDestinoEtiqueta} />}

          {action === 'DEPOSITAR' && <p className={noteBanner}>Cuentas lo confirmará en Entradas bancarias › Envíos desde Caja General cuando se acredite. Este paso no aumenta el saldo bancario ni mueve efectivo de Caja.</p>}
          {action === 'COBRAR_BANCO' && <p className={noteBanner}>Confirma únicamente cuando el banco haya acreditado los recursos.</p>}
          {action === 'ASIGNAR_COBRO_EFECTIVO' && <p className={noteBanner}>El cheque quedará pendiente de cobro en efectivo. Caja lo registrará con conteo cuando reciba el dinero.</p>}
          {action === 'RETIRAR_COBRO_EFECTIVO' && <p className={noteBanner}>El cheque volverá a Cuentas para decidir un nuevo medio de cobro.</p>}
          {action === 'DEVOLVER_A_CUENTAS' && <p className={noteBanner}>El intento quedará en el historial y el cheque volverá a estar disponible para Cajas.</p>}

          {action === 'CONFIRMAR_COBRO_EFECTIVO' && <>
            <p className={noteBanner}>Registra el efectivo recibido en Caja General. No se retirarán fondos de una cuenta propia.</p>
            {cash.isPending ? <p className="text-sm text-slate-500">Consultando caja…</p>
              : cash.data && !cash.data.closedAt && <p className="text-sm text-slate-600">Caja abierta: {formatDate(cash.data.fecha)}</p>}
            <CompactDenominationTables value={counts} onChange={setCounts} disabled={locked} dense />
          </>}

          {(requiresReason || optionalReason) && (
            <div>
              <label htmlFor="cheque-reason" className={fieldLabel}>{optionalReason ? 'Observación' : 'Motivo'} {requiresReason && <span className="text-rose-600">*</span>}</label>
              <textarea id="cheque-reason" rows={4} className={fieldControl} required={requiresReason} value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          )}
          {requiresProof && <ReceiptUploadField label="Comprobante *" file={file}
            onChange={setFile} disabled={locked} dropHint="Arrastra o sube el comprobante" />}
        </>}
      </fieldset>

      <ActionDrawerFooter>
      <button
        type="submit" form={formId}
        disabled={!action || mutation.isPending || (action === 'CONFIRMAR_COBRO_EFECTIVO' && (cash.isPending || cash.isError || !cash.data || !!cash.data.closedAt))}
        className={`inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${requiresReason ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
      >
        {mutation.isPending ? 'Guardando…' : pendingCommand.current ? 'Reintentar solicitud' : action === 'DEPOSITAR' ? 'Validar y enviar a depósito' : action === 'CONFIRMAR_COBRO_EFECTIVO' ? 'Validar con este conteo' : 'Confirmar acción'}
      </button>
      </ActionDrawerFooter>
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
              <p className="font-medium text-slate-900">{actionLabels[h.accion as ChequeAction] ?? h.accion.replace(/_/g, ' ').toLocaleLowerCase('es-MX')} · {formatDateTime(h.fecha)}</p>
              <p className="text-xs text-slate-500">{h.usuarioNombre}</p>
              {h.motivo && <p className="mt-1 text-xs text-slate-600">{h.motivo}</p>}
              {h.comprobanteUrl && <ReceiptViewerLink className={`${linkStyle} mt-1 inline-block`} href={h.comprobanteUrl}>Ver comprobante</ReceiptViewerLink>}
            </li>
          ))}
        </ul>
      )}
    </div>
  </>;
}
