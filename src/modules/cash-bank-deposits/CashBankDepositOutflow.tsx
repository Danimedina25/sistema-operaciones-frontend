import { useDeferredValue, useId, useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getBankAccounts } from '@/modules/bank-accounts/api/bank-accounts.api';
import { cajaGeneralApi } from '@/modules/caja-general/api/caja-general.api';
import { CompactDenominationTables } from '@/modules/caja-general/components/CompactDenominationTables';
import { checkCount, countCents, emptyCounts } from '@/modules/caja-general/utils/cash-amounts';
import type { CashCounts } from '@/modules/caja-general/types/caja-general.types';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { Button } from '@/shared/components/ui/Button';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { formatDateTime, formatMoney } from '@/shared/format';
import { officeToday, shiftDay } from '@/shared/utils/period';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { cashBankDepositsApi, depositMethodLabel, type CashBankDeposit, type DepositMethod } from './api';
import { EditCashBankDepositModal } from './EditCashBankDepositModal';

const inputClass = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
const statusLabel: Record<CashBankDeposit['estatus'], string> = {
  PENDIENTE: 'En tránsito', CONFIRMADO: 'Confirmado',
  RECHAZADO_PENDIENTE_DEVOLUCION: 'Devolución pendiente', CANCELADO: 'Cancelado',
};

export function CashBankDepositOutflow() {
  const client = useQueryClient();
  const { user, hasRole } = useAuth();
  const canRegister = hasRole(['JEFA_CAJAS', 'ADMIN']);
  const [accountId, setAccountId] = useState('');
  const [method, setMethod] = useState<DepositMethod>('VENTANILLA');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [counts, setCounts] = useState<CashCounts>(emptyCounts);
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [returning, setReturning] = useState<CashBankDeposit | null>(null);
  const [editing, setEditing] = useState<CashBankDeposit | null>(null);
  const [returnCounts, setReturnCounts] = useState<CashCounts>(emptyCounts);
  const returnCount = returning ? checkCount(countCents(returnCounts), Math.round(returning.monto * 100)) : null;
  const [returnError, setReturnError] = useState('');
  const returnFormId = useId();
  const submitting = useRef(false);
  const requestId = useRef<string | null>(null);
  const requestSignature = useRef<string | null>(null);
  const uploadedProof = useRef<{ file: File; url: string } | null>(null);
  const today = officeToday();
  const deferredAmount = useDeferredValue(amount);
  const numericAmount = /^\d{1,13}(\.\d{1,2})?$/.test(deferredAmount) ? Number(deferredAmount) : 0;
  const accounts = useQuery({ queryKey: ['bank-accounts'], queryFn: getBankAccounts });
  const day = useQuery({ queryKey: ['cash-general', 'latest'], queryFn: cajaGeneralApi.latest });
  const preview = useQuery({ queryKey: ['cash-bank-deposits', 'preview', numericAmount, accountId],
    queryFn: () => cashBankDepositsApi.preview(numericAmount, accountId ? Number(accountId) : undefined) });
  const recent = useQuery({ queryKey: ['cash-bank-deposits', 'recent', today],
    queryFn: () => cashBankDepositsApi.list(shiftDay(today, -30), today) });
  const recentCash = recent.data?.filter(row => row.origen === 'EFECTIVO_CAJA') ?? [];
  const returns = useQuery({ queryKey: ['cash-bank-deposits', 'returns'], queryFn: cashBankDepositsApi.returns });
  const account = accounts.data?.find(row => row.id === Number(accountId));
  const open = day.data && day.data.fecha === today && !day.data.closedAt;

  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['cash-bank-deposits'] }),
      client.invalidateQueries({ queryKey: ['cash-general'] }),
      client.invalidateQueries({ queryKey: ['bank-account-balance'] }),
      client.invalidateQueries({ queryKey: ['bank-movements'] }),
      client.invalidateQueries({ queryKey: ['general-cut'] }),
    ]);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!user || !canRegister || !open || !accountId || !proof || !numericAmount || amount !== deferredAmount) return;
    if (!preview.data?.suficiente) { setError('Saldo disponible insuficiente en Caja General.'); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      const uploadedUrl = uploadedProof.current?.file === proof
        ? uploadedProof.current.url
        : (await uploadOperationProof({ file: proof, userId: user.userId, folder: 'envios-caja' })).downloadUrl;
      uploadedProof.current = { file: proof, url: uploadedUrl };
      const signature = JSON.stringify([accountId, method, amount, reference.trim(), uploadedUrl, counts]);
      if (requestSignature.current !== signature) {
        requestId.current = crypto.randomUUID();
        requestSignature.current = signature;
      }
      const id = requestId.current ?? crypto.randomUUID();
      requestId.current = id;
      await cashBankDepositsApi.register({
        requestId: id, bankAccountId: Number(accountId), monto: Number(amount),
        forma: method, referencia: reference.trim() || null,
        comprobanteSalidaUrl: uploadedUrl, denominaciones: counts,
      });
      requestId.current = null; requestSignature.current = null; uploadedProof.current = null;
      setAccountId(''); setMethod('VENTANILLA'); setAmount(''); setReference(''); setCounts(emptyCounts()); setProof(null);
      await refresh();
    } catch (caught) { setError(getApiErrorMessage(caught)); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function confirmReturn() {
    if (!returning || submitting.current) return;
    submitting.current = true; setBusy(true); setReturnError('');
    try {
      await cashBankDepositsApi.confirmReturn(returning.id, returnCounts);
      setReturning(null); setReturnCounts(emptyCounts());
      await refresh();
    } catch (caught) { setReturnError(getApiErrorMessage(caught)); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <div className="space-y-5">
    {returns.data?.length ? <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <strong>{returns.data.length} {returns.data.length === 1 ? 'envío rechazado requiere' : 'envíos rechazados requieren'} devolución con conteo.</strong>
      <div className="mt-2 flex flex-wrap gap-2">{returns.data.map(row => <Button key={row.id} type="button" variant="neutral" className="h-8 px-3 text-xs"
        onClick={() => { setReturning(row); setReturnCounts(emptyCounts()); setReturnError(''); }}>Confirmar devolución #{row.id} · {formatMoney(row.monto)}</Button>)}</div>
    </section> : null}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
      <form onSubmit={submit} className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="text-lg font-bold text-slate-900">Datos del envío</h2>
          <p className="text-sm text-slate-500">Registra el efectivo que depositarás en una cuenta bancaria.</p></div>
        <div>
          <BankAccountCombobox label="Cuenta bancaria destino" accounts={accounts.data ?? []}
            value={accountId ? Number(accountId) : null} onChange={id => setAccountId(id === null ? '' : String(id))}
            placeholder="Busca por banco, titular o número…" disabled={!canRegister || !open || busy}
            isLoading={accounts.isPending} loadError={accounts.isError ? 'No fue posible cargar cuentas.' : null}
            onlyActive clearSelectionOnInput />
          {accounts.isError && <button type="button" onClick={() => void accounts.refetch()} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">Reintentar carga de cuentas</button>}
        </div>
        {accountId && <p className="text-sm text-emerald-700">Saldo actual de la cuenta: <strong>{formatMoney(preview.data?.saldoCuenta)}</strong></p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Forma de envío
            <select value={method} onChange={event => setMethod(event.target.value as DepositMethod)}
              disabled={!canRegister || !open || busy} className={`mt-2 ${inputClass}`}>
              {Object.entries(depositMethodLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
          <label className="text-sm font-semibold text-slate-700">Monto
            <input value={amount} onChange={event => setAmount(event.target.value)} required inputMode="decimal"
              pattern="\d{1,13}(\.\d{1,2})?" placeholder="0.00" disabled={!canRegister || !open || busy}
              className={`mt-2 ${inputClass}`} /></label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">Referencia (opcional)
          <input value={reference} onChange={event => setReference(event.target.value)} maxLength={300}
            placeholder="Folio del depósito" disabled={!canRegister || !open || busy} className={`mt-2 ${inputClass}`} /></label>
        <div><h3 className="mb-3 text-sm font-semibold text-slate-900">Desglose del efectivo que sale</h3>
          <CompactDenominationTables value={counts} onChange={setCounts} disabled={!canRegister || !open || busy} dense /></div>
        <ReceiptUploadField file={proof} onChange={setProof} label="Comprobante de salida" disabled={!canRegister || !open || busy} maxBytes={5_242_880} />
        {!open && <p role="alert" className="text-sm text-amber-800">Abre la Caja General de hoy para registrar envíos.</p>}
        {canRegister && <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" variant="dark" disabled={busy || !open || !account || !proof || !numericAmount || amount !== deferredAmount || !preview.data?.suficiente}>
            {busy ? 'Registrando…' : 'Registrar envío'}</Button></div>}
      </form>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5">
        <h2 className="text-lg font-bold text-slate-900">Resumen del envío</h2>
        {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 space-y-4 text-sm">
          <div className="flex justify-between gap-2"><span className="text-slate-500">Saldo en Caja General</span><strong>{formatMoney(preview.data?.saldoCaja)}</strong></div>
          {preview.data && preview.data.reservadoEnTransito > 0 &&
            <div className="flex justify-between gap-2 text-amber-700"><span>Reservado en tránsito</span><strong>{formatMoney(preview.data.reservadoEnTransito)}</strong></div>}
          <div className="flex justify-between gap-2"><span className="text-slate-500">Monto a enviar</span><strong className="text-red-600">{formatMoney(preview.data?.monto)}</strong></div>
          <div className="border-t border-slate-200 pt-4"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo en caja al confirmarse</span>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{formatMoney(preview.data?.saldoAlConfirmar)}</p></div>
        </div>
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Cuentas confirmará el depósito con su comprobante. Hasta entonces, el efectivo queda en tránsito y reservado para este envío.</p>
      </aside>
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">Envíos recientes</h2>
      {recentCash.length ? <div className="divide-y divide-slate-100">{recentCash.map(row =>
        <div key={row.id} className="grid gap-2 px-5 py-3 text-sm lg:grid-cols-[1fr_1fr_1fr_auto_auto_auto] lg:items-center">
          <span>{formatDateTime(row.registradoEn)}</span><span className="min-w-0" title={`${row.cuenta} · ${row.cuentaTitular}`}><strong className="block truncate font-medium">{row.cuenta}</strong><small className="block truncate text-slate-500">{row.cuentaTitular}</small></span>
          <span>{depositMethodLabel[row.forma as DepositMethod] ?? row.forma}</span>
          <StatusBadge tone={row.estatus === 'CONFIRMADO' ? 'success' : row.estatus === 'CANCELADO' ? 'danger' : 'pending'}>{statusLabel[row.estatus]}</StatusBadge>
          <strong className="text-right tabular-nums">{formatMoney(row.monto)}</strong>
          <span className="min-w-16 text-right">{canRegister && row.estatus === 'PENDIENTE' &&
            <button type="button" onClick={() => setEditing(row)} className="text-xs font-semibold text-blue-600 hover:underline">Editar</button>}</span>
        </div>)}</div> : <p className="p-5 text-sm text-slate-500">Aún no hay envíos de Caja a cuentas bancarias.</p>}
    </section>
    {editing && <EditCashBankDepositModal key={`${editing.id}-${editing.version ?? 'legacy'}`} deposit={editing} accounts={accounts.data ?? []}
      onClose={() => setEditing(null)} onSaved={refresh} />}
    <ActionDrawer open={!!returning} title="Confirmar devolución a Caja" busy={busy}
      onClose={() => { if (!submitting.current) setReturning(null); }}
      subtitle={returning ? `Envío #${returning.id}` : undefined}
      footer={<div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="neutral" disabled={busy} onClick={() => setReturning(null)}>Cancelar</Button>
        <Button type="submit" form={returnFormId} variant="success" isLoading={busy}>Confirmar devolución</Button>
      </div>}>
      {returning && <form id={returnFormId} className="space-y-4" onSubmit={event => { event.preventDefault(); void confirmReturn(); }}>
        <FinancialSummaryCard label="Resumen de la devolución" errors={[returnCount?.error, returnError]}
          note="La reserva se libera al confirmar el conteo del efectivo devuelto."
          metrics={[
            { label: 'Monto devuelto', value: formatMoney(returning.monto), tone: 'blue' },
            { label: 'Total contado', value: Number.isFinite(countCents(returnCounts)) ? formatMoney(countCents(returnCounts) / 100) : '—', tone: returnCount?.tone },
          ]}
          status={returnCount ? { text: returnCount.text, tone: returnCount.tone } : undefined} />
        <div className="sm:[&>div]:grid-cols-2"><CompactDenominationTables value={returnCounts} onChange={value => { setReturnCounts(value); setReturnError(''); }} disabled={busy} dense /></div>
      </form>}
    </ActionDrawer>
  </div>;
}
