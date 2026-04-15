import { useAuth } from '@/modules/auth/store/auth.context';
import { PaymentStatusBadge } from '@/modules/operations/components/PaymentStatusBadge';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import { OperationPaymentResponse } from '../types/operations.types.ts';

interface PaymentsTableProps {
  payments: OperationPaymentResponse[];
  onValidatePayment?: (paymentId: number) => Promise<void> | void;
  processingPaymentId?: number | null;
}

export function PaymentsTable({
  payments,
  onValidatePayment,
  processingPaymentId = null,
}: PaymentsTableProps) {
  const { hasRole } = useAuth();

  const canValidatePayments = hasRole([
    'JEFA_CAJAS',
    'AUXILIAR_CUENTAS',
    'ADMIN',
  ]);

  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Esta operación aún no tiene pagos registrados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Pagos registrados
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Historial completo de pagos, validaciones y comprobantes.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-600">
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Estatus</th>
              <th className="px-4 py-3 font-medium">Registrado por</th>
              <th className="px-4 py-3 font-medium">Fecha pago</th>
              <th className="px-4 py-3 font-medium">Validado por</th>
              <th className="px-4 py-3 font-medium">Fecha validación</th>
              <th className="px-4 py-3 font-medium">Comprobante</th>
              {canValidatePayments ? (
                <th className="px-4 py-3 font-medium">Acciones</th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => {
              const isPendingValidation =
                payment.estatus === 'PENDIENTE_VALIDACION';
              const isProcessing = processingPaymentId === payment.id;

              return (
                <tr key={payment.id} className="border-t border-slate-200 text-sm">
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {formatCurrency(payment.monto)}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {paymentTypeLabels[payment.tipoPago]}
                  </td>

                  <td className="px-4 py-4">
                    <PaymentStatusBadge status={payment.estatus} />
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {payment.registradoPorNombre}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {formatDateTime(payment.fechaPago)}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {payment.validadoPorNombre ?? 'Pendiente'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {formatDateTime(payment.fechaValidacion)}
                  </td>

                  <td className="px-4 py-4">
                    <a
                      href={payment.comprobanteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      Ver comprobante
                    </a>
                  </td>

                  {canValidatePayments ? (
                    <td className="px-4 py-4">
                      {isPendingValidation ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => void onValidatePayment?.(payment.id)}
                          className="inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? 'Validando...' : 'Validar pago'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin acciones
                        </span>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}