import { Link } from 'react-router-dom';
import { buildOperationDetailPath, paths } from '@/routes/paths';
import { formatAccount, formatDateTime, formatMoney } from '@/shared/format';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { BANK_MOVEMENT_ORIGINS, BANK_MOVEMENT_TYPES, type BankMovement } from '../types/bank-movements.types';

function Reference({ movement }: { movement: BankMovement }) {
  if (movement.operacionId) return <Link className="text-[#3b6ef5] hover:underline" to={buildOperationDetailPath(movement.operacionId)}>Operación #{movement.operacionId}</Link>;
  if (movement.cashMovementId) return <Link className="text-[#3b6ef5] hover:underline" to={paths.cajaGeneral}>Caja General #{movement.cashMovementId}</Link>;
  return <span className="text-slate-400">{BANK_MOVEMENT_ORIGINS[movement.origen]}</span>;
}

const columns: DataTableColumn<BankMovement>[] = [
  { key: 'date', header: 'Fecha y hora', width: '19%', cell: row => formatDateTime(row.fecha) },
  { key: 'concept', header: 'Concepto', width: '31%', cell: row => <span className="block min-w-0 truncate" title={`${row.concepto} · ${BANK_MOVEMENT_ORIGINS[row.origen]}`}><strong className="block truncate text-slate-900">{row.concepto}</strong><small className="block truncate">{BANK_MOVEMENT_TYPES[row.tipo] ?? row.tipo} · <Reference movement={row} /></small></span> },
  { key: 'account', header: 'Cuenta', width: '23%', cell: row => <span className="block min-w-0 truncate" title={`${row.cuentaBanco} · ${row.cuentaTitular}`}><strong className="block truncate text-slate-900">{row.cuentaTitular}</strong><small className="block truncate">{formatAccount(row.cuentaBanco, row.cuentaNumero)}</small></span> },
  { key: 'type', header: 'Tipo', kind: 'status', width: '12%', cell: row => <StatusBadge tone={row.direccion === 'ENTRADA' ? 'success' : 'danger'} className="whitespace-nowrap">{row.direccion === 'ENTRADA' ? 'Entrada' : 'Salida'}</StatusBadge> },
  { key: 'amount', header: 'Monto', kind: 'actions', width: '15%', cell: row => <strong className={`whitespace-nowrap tabular-nums ${row.direccion === 'ENTRADA' ? 'text-emerald-700' : 'text-red-700'}`}>{row.direccion === 'ENTRADA' ? '+' : '−'}{formatMoney(row.monto)}</strong> },
];

export function BankMovementsTable({ movements }: { movements: BankMovement[] }) {
  return <DataTable columns={columns} rows={movements} getRowKey={row => row.id}
    mobile={{ title: row => row.concepto, subtitle: row => formatDateTime(row.fecha), status: row => <StatusBadge tone={row.direccion === 'ENTRADA' ? 'success' : 'danger'}>{row.direccion === 'ENTRADA' ? 'Entrada' : 'Salida'}</StatusBadge>, fields: [
      { key: 'account', label: 'Cuenta', value: row => formatAccount(row.cuentaBanco, row.cuentaNumero) },
      { key: 'origin', label: 'Origen', value: row => <Reference movement={row} /> },
      { key: 'amount', label: 'Monto', value: row => `${row.direccion === 'ENTRADA' ? '+' : '−'}${formatMoney(row.monto)}` },
    ] }} emptyTitle="Sin movimientos" emptyDescription="No hay movimientos bancarios en este periodo." />;
}
