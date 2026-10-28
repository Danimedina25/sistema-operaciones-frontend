import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Landmark, Send } from 'lucide-react';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { Button } from '@/shared/components/ui/Button';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { formatAccount, formatMoney, formatPercent, formatPeriod } from '@/shared/format';
import { getBeneficiaryCommissionDetail } from '../api/commercial-partner-commissions.api';
import type { CommissionPartnerSummaryResponse } from '../types/commercial-partner-commissions.types';

interface Props {
  open: boolean;
  beneficiary: CommissionPartnerSummaryResponse | null;
  startDate: string;
  endDate: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (paymentProofFile: File, cuentaOrigenId: number) => Promise<void>;
}

export function PayBeneficiaryCommissionsModal({
  open, beneficiary, startDate, endDate, isSubmitting = false, onClose, onSubmit,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [accountError, setAccountError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const busy = isSubmitting || saving;
  const { accounts, isLoading: loadingAccounts } = useBankAccounts({ enabled: open });
  const selectedAccount = accounts.find(account => account.id === accountId);
  const detail = useQuery({
    queryKey: ['commission-pay-detail', beneficiary?.beneficiaryType, beneficiary?.beneficiaryId, startDate, endDate],
    queryFn: () => getBeneficiaryCommissionDetail({
      beneficiaryId: beneficiary!.beneficiaryId, beneficiaryType: beneficiary!.beneficiaryType, startDate, endDate,
    }),
    enabled: open && Boolean(beneficiary),
    staleTime: 60_000,
  });
  const pendingOperations = detail.data?.operations.filter(row =>
    beneficiary?.commissionIdsToPay.includes(row.commissionId)) ?? [];

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setAccountId(null);
    setAccountError('');
    setSubmitError('');
  }, [open, beneficiary?.beneficiaryId, beneficiary?.beneficiaryType]);

  async function submit() {
    if (submitting.current || busy || !beneficiary || !file) return;
    if (!accountId) {
      setAccountError('Selecciona la cuenta desde la que se transfiere.');
      return;
    }
    submitting.current = true;
    setSaving(true);
    setAccountError('');
    setSubmitError('');
    try { await onSubmit(file, accountId); }
    catch (error) { setSubmitError(getApiErrorMessage(error)); }
    finally { submitting.current = false; setSaving(false); }
  }

  const accountNumber = beneficiary?.cuentaBancaria ?? '';
  return <ActionDrawer open={open} title="Pagar comisiones"
    subtitle={`${beneficiary?.nombre ?? ''} · ${formatPeriod(startDate, endDate)}`}
    busy={busy} onClose={onClose}
    footer={<div className="flex items-center gap-3">
      <Button variant="neutral" disabled={busy} onClick={onClose}>Cancelar</Button>
      <Button variant="primary" className="min-w-0 flex-1" isLoading={busy} disabled={!beneficiary || !file} onClick={() => void submit()}>
        <Send className="size-4" />Registrar pago
      </Button>
    </div>}>
    {beneficiary && <div className="space-y-4">
      <FinancialSummaryCard label="Resumen del pago" errors={[accountError, submitError]}
        context={`${beneficiary.totalOperaciones} ${beneficiary.totalOperaciones === 1 ? 'operación' : 'operaciones'}`}
        metrics={[{ label: 'Comisiones por pagar', value: formatMoney(beneficiary.totalPendientes), tone: 'blue' }]} />
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full table-fixed text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr><th className="w-[13%] px-2 py-2 text-left">Folio</th><th className="w-[31%] px-2 py-2 text-left">Cliente</th><th className="w-[23%] px-2 py-2 text-right">Monto</th><th className="w-[10%] px-2 py-2 text-right">%</th><th className="w-[23%] px-2 py-2 text-right">Comisión</th></tr>
          </thead>
          <tbody>{pendingOperations.map(row => <tr key={row.commissionId} className="border-t border-slate-100">
            <td className="px-2 py-3 text-slate-500">#{row.operationId}</td>
            <td className="truncate px-2 py-3 font-semibold" title={row.clienteNombre}>{row.clienteNombre}</td>
            <td className="px-2 py-3 text-right tabular-nums">{formatMoney(row.operationAmount)}</td>
            <td className="px-2 py-3 text-right tabular-nums">{formatPercent(row.commissionPercentage)}</td>
            <td className="px-2 py-3 text-right font-bold tabular-nums">{formatMoney(row.commissionAmount)}</td>
          </tr>)}</tbody>
        </table>
        {detail.isPending && <p className="p-3 text-xs text-slate-500">Cargando operaciones…</p>}
        {detail.error && <p role="alert" className="p-3 text-xs text-red-700">No se pudo consultar el desglose de operaciones.</p>}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Transferir a</p>
        <div className="mt-2 flex items-center gap-3">
          <Landmark className="size-4 shrink-0 text-slate-500" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" title={beneficiary.nombre}>{beneficiary.nombre}</p>
            <p className="text-xs text-slate-500">Cuenta para pago de comisión · {formatAccount(beneficiary.banco, beneficiary.cuentaBancaria)}</p></div>
          {accountNumber && <button type="button" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#3b6ef5]"
            onClick={() => void navigator.clipboard.writeText(accountNumber)}><Copy className="size-3" />Copiar cuenta</button>}
        </div>
      </div>
      <BankAccountCombobox label="Cuenta origen" accounts={accounts} value={accountId}
        onChange={id => { setAccountId(id); setAccountError(''); setSubmitError(''); }}
        disabled={busy} isLoading={loadingAccounts} onlyActive />
      <ReceiptUploadField file={file} onChange={value => { setFile(value); setSubmitError(''); }} disabled={busy} label="Comprobante de pago" camera={false}
        dropHint="Subir comprobante de la transferencia" />
      {selectedAccount && <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
        El pago se registrará como salida de {formatAccount(selectedAccount.banco, selectedAccount.numeroCuenta)}.
      </p>}
    </div>}
  </ActionDrawer>;
}
