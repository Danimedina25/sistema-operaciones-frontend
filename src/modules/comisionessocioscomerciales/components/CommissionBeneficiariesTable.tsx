import { ReceiptViewerLink } from '@/shared/components/ui/ReceiptViewerLink';
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { Pagination } from '@/shared/components/ui/Pagination';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { formatDate, formatMoney, formatAccount } from '@/shared/format';
import { useWhatsAppLink } from '@/shared/hooks/use-whatsapp-link';
import { buildCommissionPaidMessage } from '@/shared/utils/whatsapp-message';
import { paths } from '@/routes/paths';
import type { CommissionPartnerSummaryResponse } from '../types/commercial-partner-commissions.types';

interface Props {
  beneficiaries: CommissionPartnerSummaryResponse[];
  onPayBeneficiary: (beneficiary: CommissionPartnerSummaryResponse) => void;
  onViewDetail: (beneficiary: CommissionPartnerSummaryResponse) => void;
  canManagePayments: boolean;
  periodLabel?: string;
  showStatus?: boolean;
}

export function CommissionBeneficiariesTable({ beneficiaries, onPayBeneficiary, onViewDetail, canManagePayments, periodLabel, showStatus = true }: Props) {
  const { openWhatsApp } = useWhatsAppLink();
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [beneficiaries]);
  const pageSize = 10;
  const rows = beneficiaries.slice((page - 1) * pageSize, page * pageSize);
  function status(row: CommissionPartnerSummaryResponse) {
    return <StatusBadge tone={row.estatus === 'PAGADA' ? 'success' : row.estatus === 'PARCIAL' ? 'info' : 'pending'}>
      {row.estatus === 'PAGADA' ? 'Pagada' : row.estatus === 'PARCIAL' ? 'Parcial' : 'Por pagar'}
    </StatusBadge>;
  }
  function actions(row: CommissionPartnerSummaryResponse) {
    const canPay = row.commissionIdsToPay?.length > 0;
    return <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="neutral" className="h-8 px-3 text-xs" onClick={() => onViewDetail(row)}>Ver detalle</Button>
      {canPay ? canManagePayments ? <Button variant="dark" className="h-8 px-3 text-xs" onClick={() => onPayBeneficiary(row)}>Pagar</Button>
        : <span className="text-xs text-slate-400">Pendiente de pago</span>
        : row.paymentProofUrl ? <ReceiptViewerLink href={row.paymentProofUrl} className="inline-flex h-11 items-center rounded-control border border-slate-300 px-5 text-sm font-semibold text-slate-900">Ver comprobante</ReceiptViewerLink>
          : <span className="text-xs text-slate-400">Sin comprobante</span>}
      {!canPay && row.telefono && <Button variant="neutral" onClick={() => openWhatsApp(buildCommissionPaidMessage({
        monto: row.totalPagadas, publicUrl: window.location.origin + paths.miscomisiones,
      }), row.telefono)}><MessageCircle size={14} /> Avisar por WhatsApp</Button>}
    </div>;
  }
  const columns: DataTableColumn<CommissionPartnerSummaryResponse>[] = [
    { key: 'beneficiary', header: 'Beneficiario', width: showStatus ? '28%' : '32%', cell: row => <span className="block min-w-0"><strong className="block truncate text-slate-900" title={row.nombre}>{row.nombre}</strong><small className="block truncate text-slate-500" title={row.banco && row.cuentaBancaria ? formatAccount(row.banco, row.cuentaBancaria) : undefined}>{row.banco && row.cuentaBancaria ? formatAccount(row.banco, row.cuentaBancaria) : row.beneficiaryType === 'COMMERCIAL_PARTNER' ? 'Socio comercial' : 'Usuario'}</small></span> },
    { key: 'week', header: 'Semana', width: '15%', cell: () => periodLabel ?? '—' },
    { key: 'operations', header: 'Operaciones', width: '10%', cell: row => row.totalOperaciones },
    { key: 'amount', header: 'Por pagar', width: '15%', cell: row => <strong className="whitespace-nowrap text-amber-700">{formatMoney(row.totalPendientes)}</strong> },
    ...(showStatus ? [{ key: 'status', header: 'Estado', kind: 'status' as const, width: '10%', cell: status }] : []),
    { key: 'actions', header: 'Acciones', kind: 'actions', width: showStatus ? '22%' : '28%', cell: actions },
  ];
  return <><DataTable columns={columns} rows={rows} getRowKey={row => row.beneficiaryType + '-' + row.beneficiaryId}
    mobile={{ title: row => row.nombre, subtitle: row => row.banco && row.cuentaBancaria ? formatAccount(row.banco, row.cuentaBancaria) : row.beneficiaryType === 'COMMERCIAL_PARTNER' ? 'Socio comercial' : 'Usuario',
      status, fields: [{ key: 'week', label: 'Semana', value: () => periodLabel ?? '—' },
        { key: 'operations', label: 'Operaciones', value: row => row.totalOperaciones },
        { key: 'amount', label: 'Por pagar', value: row => formatMoney(row.totalPendientes) },
        { key: 'paid', label: 'Pagado', value: row => formatMoney(row.totalPagadas) },
        { key: 'date', label: 'Fecha de pago', value: row => row.fechaPagada ? formatDate(row.fechaPagada) : '—' }], actions }}
    emptyTitle="Sin comisiones" emptyDescription="Prueba con otro periodo o estado." />
    {beneficiaries.length > pageSize && <div className="border-t border-slate-100 p-3"><Pagination currentPage={page} totalPages={Math.ceil(beneficiaries.length / pageSize)} totalElements={beneficiaries.length} onPageChange={setPage} /></div>}
  </>;
}
