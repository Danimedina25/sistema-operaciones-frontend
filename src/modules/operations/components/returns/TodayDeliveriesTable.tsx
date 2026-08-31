import { MessageCircle } from 'lucide-react';
import { DeliverySemaphoreBadge } from '@/shared/components/dashboard/DeliverySemaphoreBadge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useWhatsAppLink } from '@/shared/hooks/use-whatsapp-link';
import { buildDeliveryNoticeMessage } from '@/shared/utils/whatsapp-message';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import { formatCurrency, formatDateTime } from '@/modules/operations/utils/operation-formatters';
import type { ReturnInstallment } from '@/modules/operations/types/operations.types.ts';

interface TodayDeliveriesTableProps {
  deliveries: ReturnInstallment[];
  onMarkAsDelivered: (installment: ReturnInstallment) => void;
}

function getAuthorizedRecipient(delivery: ReturnInstallment): string {
  const names = [
    delivery.autorizadoParaRecibir1,
    delivery.autorizadoParaRecibir2,
    delivery.autorizadoParaRecibir3,
  ].filter(Boolean);

  if (names.length > 0) return names.join(', ');

  return delivery.socioComercialNombre ?? '-';
}

export function TodayDeliveriesTable({ deliveries, onMarkAsDelivered }: TodayDeliveriesTableProps) {
  const { openWhatsApp } = useWhatsAppLink();

  if (deliveries.length === 0) {
    return (
      <EmptyState
        title="Sin entregas programadas para hoy"
        description="Las recolecciones de efectivo y retiro sin tarjeta de hoy aparecerán aquí."
      />
    );
  }

  function handleNotifyViaWhatsApp(delivery: ReturnInstallment) {
    const message = buildDeliveryNoticeMessage({
      operationId: delivery.operationId,
      scheduledAtLabel: delivery.fechaHoraRecoleccion
        ? formatDateTime(delivery.fechaHoraRecoleccion)
        : '-',
      deliveryTypeLabel: paymentTypeLabels[delivery.tipoPago],
    });

    openWhatsApp(message, delivery.socioComercialTelefono);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-slate-100">
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              <th className="min-w-[110px] px-4 py-3 font-medium">Hora</th>
              <th className="min-w-[130px] px-4 py-3 font-medium">Operación</th>
              <th className="min-w-[170px] px-4 py-3 font-medium">Socio o cliente autorizado</th>
              <th className="min-w-[110px] px-4 py-3 font-medium">Monto</th>
              <th className="min-w-[130px] px-4 py-3 font-medium">Tipo</th>
              <th className="min-w-[160px] px-4 py-3 font-medium">Estado</th>
              <th className="min-w-[260px] px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {deliveries.map((delivery) => {
              // Paso final: el socio ya confirmó la recolección (ENTREGADA)
              // y falta el cierre de JEFA_CAJAS.
              const canAct = delivery.estatus === 'ENTREGADA';

              return (
                <tr
                  key={delivery.id}
                  className="border-t border-slate-100 text-sm transition hover:bg-blue-50/40"
                >
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                    {delivery.fechaHoraRecoleccion
                      ? formatDateTime(delivery.fechaHoraRecoleccion)
                      : '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    <p className="font-medium text-slate-900">#{delivery.operationId}</p>
                    {delivery.clienteNombre ? (
                      <p className="text-xs text-slate-500">{delivery.clienteNombre}</p>
                    ) : null}
                  </td>

                  <td className="px-4 py-4 text-slate-600">{getAuthorizedRecipient(delivery)}</td>

                  <td className="whitespace-nowrap px-4 py-4 font-bold tabular-nums text-slate-950">
                    {formatCurrency(delivery.monto)}
                  </td>

                  <td className="px-4 py-4 text-slate-600">{paymentTypeLabels[delivery.tipoPago]}</td>

                  <td className="px-4 py-4">
                    <DeliverySemaphoreBadge
                      estatus={delivery.estatus}
                      scheduledAt={delivery.fechaHoraRecoleccion}
                    />
                  </td>

                  <td className="px-4 py-4">
                    {canAct ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleNotifyViaWhatsApp(delivery)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Avisar por WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => onMarkAsDelivered(delivery)}
                          className="inline-flex min-h-[40px] items-center rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white transition hover:bg-indigo-700"
                        >
                          Marcar como entregado
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Sin acciones</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
