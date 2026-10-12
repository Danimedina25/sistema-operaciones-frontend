import { MessageCircle } from 'lucide-react';
import { DeliverySemaphoreBadge } from '@/shared/components/dashboard/DeliverySemaphoreBadge';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { useWhatsAppLink } from '@/shared/hooks/use-whatsapp-link';
import { buildDeliveryNoticeMessage } from '@/shared/utils/whatsapp-message';
import { formatDateTime, formatMoney } from '@/shared/format';
import type { ReturnInstallment } from '@/modules/operations/types/operations.types.ts';

interface TodayDeliveriesTableProps {
  deliveries: ReturnInstallment[];
  onMarkAsDelivered: (installment: ReturnInstallment) => void;
}

function authorizedRecipient(delivery: ReturnInstallment): string {
  return [delivery.autorizadoParaRecibir1, delivery.autorizadoParaRecibir2, delivery.autorizadoParaRecibir3]
    .filter(Boolean).join(', ') || delivery.socioComercialNombre || '—';
}

export function TodayDeliveriesTable({ deliveries, onMarkAsDelivered }: TodayDeliveriesTableProps) {
  const { openWhatsApp } = useWhatsAppLink();
  const status = (row: ReturnInstallment) => <DeliverySemaphoreBadge estatus={row.estatus} scheduledAt={row.fechaHoraRecoleccion} />;
  const actions = (row: ReturnInstallment) => {
    const canAct = (row.estatus === 'PROGRAMADA' || row.estatus === 'ENTREGADA') && !row.cerradoPorJefa;
    if (!canAct) return <span className="text-xs text-slate-400">Sin acciones</span>;
    return <div className="flex flex-wrap justify-end gap-2">
      <button type="button" onClick={() => openWhatsApp(buildDeliveryNoticeMessage({
        operationId: row.operationId,
        scheduledAtLabel: row.fechaHoraRecoleccion ? formatDateTime(row.fechaHoraRecoleccion) : '—',
        deliveryTypeLabel: row.tipoPago === 'RETIRO_SIN_TARJETA' ? 'Retiro sin tarjeta' : 'Efectivo',
      }), row.socioComercialTelefono)}
        className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-xs font-medium text-emerald-700">
        <MessageCircle className="h-3.5 w-3.5" /> Avisar
      </button>
      <button type="button" onClick={() => onMarkAsDelivered(row)} className="min-h-9 rounded-lg bg-[#3b6ef5] px-2 text-xs font-medium text-white">Marcar entregado</button>
    </div>;
  };
  const columns: DataTableColumn<ReturnInstallment>[] = [
    { key: 'time', header: 'Hora', width: '15%', cell: row => row.fechaHoraRecoleccion ? formatDateTime(row.fechaHoraRecoleccion) : '—' },
    { key: 'operation', header: 'Operación', width: '18%', cell: row => <span><strong className="block">#{row.operationId}</strong><small className="block truncate" title={row.clienteNombre ?? ''}>{row.clienteNombre}</small></span> },
    { key: 'recipient', header: 'Autorizado', width: '17%', cell: authorizedRecipient },
    { key: 'amount', header: 'Monto', width: '12%', cell: row => <strong className="whitespace-nowrap">{formatMoney(row.monto)}</strong> },
    { key: 'status', header: 'Estatus', kind: 'status', width: '14%', cell: status },
    { key: 'actions', header: 'Acciones', kind: 'actions', width: '24%', cell: actions },
  ];
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <DataTable columns={columns} rows={deliveries} getRowKey={row => row.id}
      mobile={{ title: row => `Operación #${row.operationId}`, subtitle: row => row.clienteNombre, status,
        fields: [{ key: 'time', label: 'Hora', value: row => row.fechaHoraRecoleccion ? formatDateTime(row.fechaHoraRecoleccion) : '—' },
          { key: 'recipient', label: 'Autorizado', value: authorizedRecipient },
          { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) }], actions }}
      emptyTitle="Sin entregas programadas para hoy" emptyDescription="Las recolecciones de efectivo y retiro sin tarjeta de hoy aparecerán aquí." />
  </div>;
}
