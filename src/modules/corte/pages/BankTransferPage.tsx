import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { QueryState } from '@/shared/components/ui/QueryState';
import { formatAccount, formatDateTime, formatMoney } from '@/shared/format';
import { officeToday, shiftDay } from '@/shared/utils/period';
import { createBankTransfer, listBankTransfers } from '../api/corte.api';
import type { BankTransfer } from '../types/bank-transfers.types';
import { BankTransferForm } from '../components/BankTransferModal';

// El backend envía "Titular — Banco — Número". Las cuentas de la oficina comparten titular,
// así que lo que distingue a cada una es el banco con su terminación.
function accountParts(label: string) {
  const [titular, banco, numero] = label.split(' — ');
  return { cuenta: formatAccount(banco, numero), titular };
}

function AccountCell({ label }: { label: string }) {
  const { cuenta, titular } = accountParts(label);
  return <span className="block min-w-0"><span className="block truncate font-medium text-slate-900">{cuenta}</span>
    <small className="block truncate text-slate-500">{titular}</small></span>;
}

const columns: DataTableColumn<BankTransfer>[] = [
  { key: 'date', header: 'Fecha y hora', width: '20%', cell: row => formatDateTime(row.fecha) },
  { key: 'origin', header: 'Cuenta origen', width: '25%', cell: row => <AccountCell label={row.cuentaOrigen} /> },
  { key: 'destination', header: 'Cuenta beneficiaria', width: '25%', cell: row => <AccountCell label={row.cuentaDestino} /> },
  { key: 'reference', header: 'Referencia', width: '15%', cell: row => row.referencia ?? '—' },
  { key: 'amount', header: 'Monto', width: '15%', cell: row => <strong className="whitespace-nowrap">{formatMoney(row.monto)}</strong> },
];

export default function BankTransferPage() {
  const client = useQueryClient();
  const today = officeToday();
  const start = shiftDay(today, -30);
  const recent = useQuery({ queryKey: ['bank-transfers', start, today], queryFn: () => listBankTransfers(start, today) });
  return <div className="mx-4 space-y-6 pt-2">
    <PageHeader title="Transferir entre cuentas" />
    <BankTransferForm showSummary onClose={() => {}} onSubmit={async request => {
        const transfer = await createBankTransfer(request);
        toast.success('Transferencia registrada');
        await Promise.all([
          client.invalidateQueries({ queryKey: ['bank-transfers'] }),
          client.invalidateQueries({ queryKey: ['bank-movements'] }),
          client.invalidateQueries({ queryKey: ['account-availability'] }),
        ]);
        return transfer;
      }} />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">Transferencias recientes</h2>
      <QueryState isLoading={recent.isPending} error={recent.error} onRetry={() => void recent.refetch()} loadingLabel="Cargando transferencias…">
        <DataTable columns={columns} rows={recent.data ?? []} getRowKey={row => row.id}
          mobile={{ title: row => `${accountParts(row.cuentaOrigen).cuenta} → ${accountParts(row.cuentaDestino).cuenta}`, subtitle: row => formatDateTime(row.fecha), fields: [
            { key: 'reference', label: 'Referencia', value: row => row.referencia ?? '—' },
            { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) },
          ] }} emptyTitle="Sin transferencias recientes" emptyDescription="Las transferencias de este mes aparecerán aquí." />
      </QueryState>
    </section>
  </div>;
}
