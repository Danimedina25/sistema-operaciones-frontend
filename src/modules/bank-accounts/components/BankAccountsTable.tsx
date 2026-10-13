import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import { formatMoney, formatAccount } from '@/shared/format';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';
import { Button } from '@/shared/components/ui/Button';
import { Activity } from 'lucide-react';

interface BankAccountsTableProps {
  accounts: BankAccountResponse[];
  balances?: ReadonlyMap<number, number>;
  processingAccountId: number | null;
  canEdit: boolean;
  canToggleStatus: boolean;
  canDelete: boolean;
  onEdit: (account: BankAccountResponse) => void;
  onActivate: (accountId: number) => void | Promise<void>;
  onDeactivate: (accountId: number) => void | Promise<void>;
  onDelete: (account: BankAccountResponse) => void;
  onViewMovements: (account: BankAccountResponse) => void;
}

export function BankAccountsTable({ accounts, balances, processingAccountId, canEdit, canToggleStatus, canDelete,
  onEdit, onActivate, onDeactivate, onDelete, onViewMovements }: BankAccountsTableProps) {
  const actions = (account: BankAccountResponse) => <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
    <Button variant="neutral" className="h-8 gap-1 rounded-lg px-2.5 text-xs" onClick={() => onViewMovements(account)}><Activity className="h-3.5 w-3.5" />Movimientos</Button>
    {(canEdit || canToggleStatus || canDelete) && <RowActionsMenu triggerLabel={processingAccountId === account.id ? 'Procesando…' : 'Más opciones'} triggerDisabled={processingAccountId === account.id}>
      {canEdit && <button type="button" onClick={() => onEdit(account)} className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">Editar</button>}
      {canToggleStatus && account.activo && <button type="button" onClick={() => void onDeactivate(account.id)} className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50">Desactivar</button>}
      {canToggleStatus && !account.activo && <button type="button" onClick={() => void onActivate(account.id)} className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Activar</button>}
      {canDelete && <button type="button" onClick={() => onDelete(account)} className="block w-full border-t border-red-100 bg-red-50/50 px-4 py-2.5 text-left text-sm font-bold text-red-900 hover:bg-red-100">Eliminar definitivamente</button>}
    </RowActionsMenu>}
  </div>;
  const columns: DataTableColumn<BankAccountResponse>[] = [
    { key: 'owner', header: 'Titular', width: '48%', cell: row => <span className="block min-w-0 truncate" title={row.titular}><strong className="block truncate text-slate-900">{row.titular}</strong><small className="block text-slate-400">{row.banco}</small></span> },
    { key: 'account', header: 'Cuenta', width: '20%', cell: row => formatAccount(row.banco, row.numeroCuenta) },
    { key: 'balance', header: 'Saldo actual', width: '17%', align: 'right', className: 'text-blue-600', cell: row => <strong className="whitespace-nowrap tabular-nums text-slate-900">{balances?.has(row.id) ? formatMoney(balances.get(row.id) ?? 0) : '—'}</strong> },
    { key: 'actions', header: 'Acciones', kind: 'actions', width: '15%', align: 'right', cell: actions },
  ];
  return <DataTable columns={columns} rows={accounts} getRowKey={row => row.id}
    mobile={{ title: row => row.titular, subtitle: row => formatAccount(row.banco, row.numeroCuenta), fields: [
      { key: 'balance', label: 'Saldo actual', value: row => balances?.has(row.id) ? formatMoney(balances.get(row.id) ?? 0) : '—' },
      { key: 'status', label: 'Estado', value: row => row.activo ? 'Activa' : 'Inactiva' },
    ], actions }} emptyTitle="Sin cuentas bancarias" emptyDescription="Las cuentas registradas aparecerán aquí." />;
}
