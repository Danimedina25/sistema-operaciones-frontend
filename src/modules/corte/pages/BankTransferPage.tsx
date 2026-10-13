import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { QueryState } from '@/shared/components/ui/QueryState';
import { formatDateTime, formatMoney } from '@/shared/format';
import { officeToday } from '@/shared/utils/period';
import { createBankTransfer, listBankTransfers } from '../api/corte.api';
import type { BankTransfer } from '../types/bank-transfers.types';
import { BankTransferForm } from '../components/BankTransferModal';

const columns: DataTableColumn<BankTransfer>[] = [
  { key: 'date', header: 'Fecha y hora', width: '20%', cell: row => formatDateTime(row.fecha) },
  { key: 'origin', header: 'Cuenta origen', width: '25%', cell: row => row.cuentaOrigen },
  { key: 'destination', header: 'Cuenta beneficiaria', width: '25%', cell: row => row.cuentaDestino },
  { key: 'reference', header: 'Referencia', width: '15%', cell: row => row.referencia ?? '—' },
  { key: 'amount', header: 'Monto', width: '15%', cell: row => <strong className="whitespace-nowrap">{formatMoney(row.monto)}</strong> },
];

export default function BankTransferPage() {
  const client = useQueryClient();
  const today = officeToday();
  const start = `${today.slice(0, 7)}-01`;
  const recent = useQuery({ queryKey: ['bank-transfers', start, today], queryFn: () => listBankTransfers(start, today) });
  return <div className="space-y-5">
    <PageHeader title="Transferir entre cuentas" />
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="mb-5 text-sm font-semibold text-slate-900">Datos de la transferencia</h2>
      <BankTransferForm onClose={() => {}} onSubmit={async request => {
        const transfer = await createBankTransfer(request);
        toast.success('Transferencia registrada');
        await Promise.all([
          client.invalidateQueries({ queryKey: ['bank-transfers'] }),
          client.invalidateQueries({ queryKey: ['bank-movements'] }),
          client.invalidateQueries({ queryKey: ['account-availability'] }),
        ]);
        return transfer;
      }} />
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">Transferencias recientes</h2>
      <QueryState isLoading={recent.isPending} error={recent.error} onRetry={() => void recent.refetch()} loadingLabel="Cargando transferencias…">
        <DataTable columns={columns} rows={recent.data ?? []} getRowKey={row => row.id}
          mobile={{ title: row => `${row.cuentaOrigen} → ${row.cuentaDestino}`, subtitle: row => formatDateTime(row.fecha), fields: [
            { key: 'reference', label: 'Referencia', value: row => row.referencia ?? '—' },
            { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) },
          ] }} emptyTitle="Sin transferencias recientes" emptyDescription="Las transferencias de este mes aparecerán aquí." />
      </QueryState>
    </section>
  </div>;
}
