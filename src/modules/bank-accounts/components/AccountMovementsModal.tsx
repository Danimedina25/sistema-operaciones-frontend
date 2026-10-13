import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/shared/components/ui/Modal';
import { PeriodSelector } from '@/shared/components/ui/PeriodSelector';
import { Tabs } from '@/shared/components/ui/Tabs';
import { Pagination } from '@/shared/components/ui/Pagination';
import { QueryState } from '@/shared/components/ui/QueryState';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { formatAccount, formatDateTime, formatMoney } from '@/shared/format';
import { Landmark } from 'lucide-react';
import { officeToday, selectionFromDates } from '@/shared/utils/period';
import type { BankAccountResponse } from '../types/bank-accounts.types';
import { getBankAccountBalance, getBankMovementTotals, searchBankMovements } from '@/modules/corte/api/corte.api';
import type { BankMovement, BankMovementDirection, BankMovementFilters } from '@/modules/corte/types/bank-movements.types';

const columns: DataTableColumn<BankMovement>[] = [
  { key: 'time', header: 'Hora', width: '11%', cell: row => <span className="whitespace-nowrap">{formatDateTime(row.fecha).split(', ')[1]}</span> },
  { key: 'concept', header: 'Concepto', width: '47%', cell: row => <span className="block truncate font-medium text-slate-900" title={row.concepto}>{row.concepto}</span> },
  { key: 'type', header: 'Tipo', kind: 'status', width: '17%', cell: row => <StatusBadge tone={row.direccion === 'ENTRADA' ? 'success' : 'danger'}>{row.direccion === 'ENTRADA' ? '↓ Entrada' : '↑ Salida'}</StatusBadge> },
  { key: 'amount', header: 'Monto', kind: 'actions', width: '25%', align: 'right', cell: row => <strong className={`whitespace-nowrap tabular-nums ${row.direccion === 'ENTRADA' ? 'text-emerald-700' : 'text-red-700'}`}>{row.direccion === 'ENTRADA' ? '+' : '−'}{formatMoney(row.monto)}</strong> },
];

export function AccountMovementsModal({ account, onClose }: { account: BankAccountResponse | null; onClose: () => void }) {
  const today = officeToday();
  const [dates, setDates] = useState({ startDate: today, endDate: today });
  const [direction, setDirection] = useState<BankMovementDirection | ''>('');
  const [page, setPage] = useState(0);
  const filters: BankMovementFilters = { desde: dates.startDate, hasta: dates.endDate, bankAccountId: account?.id ?? null, banco: '', direccion: direction, tipo: '' };
  const movements = useQuery({ queryKey: ['account-movements', account?.id, dates, direction, page], queryFn: () => searchBankMovements(filters, page, 20), enabled: Boolean(account) });
  const totals = useQuery({ queryKey: ['account-movements', 'totals', account?.id, dates, direction], queryFn: () => getBankMovementTotals(filters), enabled: Boolean(account) });
  const balance = useQuery({ queryKey: ['account-balance', account?.id, dates.endDate], queryFn: () => getBankAccountBalance(account!.id, dates.endDate), enabled: Boolean(account) });
  return <Modal open={Boolean(account)} variant="light" icon={<Landmark className="h-5 w-5" />} title="Movimientos de la cuenta"
    subtitle={account ? `${formatAccount(account.banco, account.numeroCuenta)} · ${account.titular}` : undefined}
    footer={<Button variant="dark" className="h-10 rounded-lg" onClick={onClose}>Cerrar</Button>} onClose={onClose}>
    {account && <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodSelector allowAll={false} allowRange label="Periodo" value={selectionFromDates(dates.startDate, dates.endDate)} onApply={selection => { setDates({ startDate: selection.startDate, endDate: selection.endDate }); setPage(0); }} />
        <Tabs label="Dirección del movimiento" value={direction} onChange={value => { setDirection(value); setPage(0); }} options={[{ value: '', label: 'Todos' }, { value: 'ENTRADA', label: 'Entradas' }, { value: 'SALIDA', label: 'Salidas' }]} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Entradas</p><strong className="mt-1 block text-2xl tabular-nums text-emerald-800">{totals.data ? `+${formatMoney(totals.data.totalEntradas)}` : '—'}</strong></div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-red-700">Salidas</p><strong className="mt-1 block text-2xl tabular-nums text-red-800">{totals.data ? `−${formatMoney(totals.data.totalSalidas)}` : '—'}</strong></div>
        <div className="rounded-xl bg-slate-950 p-4 text-white"><p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{dates.endDate === today ? 'Saldo actual' : 'Saldo al cierre'}</p><strong className="mt-1 block text-2xl tabular-nums">{balance.data ? formatMoney(balance.data.saldoFinal) : '—'}</strong></div>
      </div>
      <QueryState isLoading={movements.isPending} error={movements.error} onRetry={() => void movements.refetch()} loadingLabel="Cargando movimientos…">
        <div className="overflow-hidden rounded-xl border border-slate-200 [&_td]:py-3"><DataTable compact columns={columns} rows={movements.data?.content ?? []} getRowKey={row => row.id}
          mobile={{ title: row => row.concepto, subtitle: row => formatDateTime(row.fecha), status: row => <StatusBadge tone={row.direccion === 'ENTRADA' ? 'success' : 'danger'}>{row.direccion === 'ENTRADA' ? 'Entrada' : 'Salida'}</StatusBadge>, fields: [{ key: 'amount', label: 'Monto', value: row => `${row.direccion === 'ENTRADA' ? '+' : '−'}${formatMoney(row.monto)}` }] }}
          emptyTitle="Sin movimientos" emptyDescription="No hay movimientos bancarios en este periodo." /></div>
      </QueryState>
      {(movements.data?.totalPages ?? 0) > 1 && <Pagination currentPage={page + 1} totalPages={movements.data?.totalPages ?? 0} totalElements={movements.data?.totalElements ?? 0} isLoading={movements.isFetching} onPageChange={next => setPage(next - 1)} />}
    </div>}
  </Modal>;
}
