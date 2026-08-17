import { MessageCircle } from 'lucide-react';
import { DeliverySemaphoreBadge } from '@/shared/components/dashboard/DeliverySemaphoreBadge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useWhatsAppLink } from '@/shared/hooks/use-whatsapp-link';
import { buildDeliveryNoticeMessage } from '@/shared/utils/whatsapp-message';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import { formatCurrency, formatDateTime } from '@/modules/operations/utils/operation-formatters';
import type { ReturnPaymentResponse } from '@/modules/operations/types/operations.types.ts';

interface TodayDeliveriesTableProps {
  deliveries: ReturnPaymentResponse[];
  onMarkAsDelivered: (returnPayment: ReturnPaymentResponse) => void;
}

function getAuthorizedRecipient(delivery: ReturnPaymentResponse): string {
  const names = [
    delivery.autorizadoParaRecibirEfectivo1,
    delivery.autorizadoParaRecibirEfectivo2,
    delivery.autorizadoParaRecibirEfectivo3,
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

  function handleNotifyViaWhatsApp(delivery: ReturnPaymentResponse) {
    const message = buildDeliveryNoticeMessage({
      operationId: delivery.operationId,
      scheduledAtLabel: delivery.fechaHoraRecoleccionEfectivo
        ? formatDateTime(delivery.fechaHoraRecoleccionEfectivo)
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
              <th className="px-4 py-3 font-medium">Hora</th>
              <th className="px-4 py-3 font-medium">Operación</th>
              <th className="px-4 py-3 font-medium">Socio o cliente autorizado</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {deliveries.map((delivery) => {
              const canAct = delivery.estatus === 'EN_RECOLECCION';

              return (
                <tr
                  key={delivery.id}
                  className="border-t border-slate-100 text-sm transition hover:bg-blue-50/40"
                >
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                    {delivery.fechaHoraRecoleccionEfectivo
                      ? formatDateTime(delivery.fechaHoraRecoleccionEfectivo)
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
                      scheduledAt={delivery.fechaHoraRecoleccionEfectivo}
                    />
                  </td>

                  <td className="px-4 py-4">
                    {canAct ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleNotifyViaWhatsApp(delivery)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Avisar por WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => onMarkAsDelivered(delivery)}
                          className="inline-flex h-8 items-center rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white transition hover:bg-indigo-700"
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
