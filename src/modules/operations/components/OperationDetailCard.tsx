import { operationStatusLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { OperationStatusBadge } from './OperationStatusBadge.js';
import { useMarkOperationAsInvoiced } from '../hooks/use-mark-operations-as-invoiced.js';

interface OperationDetailCardProps {
  operation: PaymentOperationResponse;
  canViewFinancialDetails: boolean;
  onOperationUpdated?: () => void | Promise<void>;
}

function SummaryItem({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'emerald' | 'blue' | 'amber';
}) {
  const variants = {
    default: {
      container: 'border-slate-200 bg-slate-50',
      label: 'text-slate-500',
      value: 'text-slate-900',
    },
    emerald: {
      container: 'border-emerald-200 bg-emerald-50',
      label: 'text-emerald-700',
      value: 'text-emerald-900',
    },
    blue: {
      container: 'border-sky-200 bg-sky-50',
      label: 'text-sky-700',
      value: 'text-sky-900',
    },
    amber: {
      container: 'border-amber-200 bg-amber-50',
      label: 'text-amber-700',
      value: 'text-amber-900',
    },
  };

  const styles = variants[variant];

  return (
    <div className={`rounded-2xl border p-4 ${styles.container}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${styles.label}`}>
        {label}
      </p>

      <div className={`mt-2 text-sm font-semibold ${styles.value}`}>
        {value}
      </div>
    </div>
  );
}

export function OperationDetailCard({
  operation,
  canViewFinancialDetails,
  onOperationUpdated,
}: OperationDetailCardProps) {
  const shouldShowUpdatedAt =
    operation.updatedAt &&
    operation.createdAt &&
    new Date(operation.updatedAt).getTime() !==
      new Date(operation.createdAt).getTime();

  const { processingOperationId, submitMarkAsInvoiced } =
    useMarkOperationAsInvoiced({
      onSuccess: onOperationUpdated,
    });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Operación #{operation.id}
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            Cliente: {operation.clienteNombre}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Registrada el {formatDateTime(operation.createdAt)}
          </p>
        </div>

        <div className="self-start">
          <OperationStatusBadge status={operation.estatus} />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Información general
          </h3>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryItem
            label="Socio comercial"
            value={operation.socioComercialNombre}
          />

          <SummaryItem
            label="Monto total"
            value={formatCurrency(operation.montoTotal)}
          />

          <SummaryItem
            label="Estatus"
            value={
              operationStatusLabels[operation.estatus] ?? operation.estatus
            }
          />

          <SummaryItem
            label="Monto validado"
            value={formatCurrency(operation.montoValidado)}
          />

          <SummaryItem
            label="Monto pendiente por validar"
            value={formatCurrency(operation.saldoPendiente)}
          />

          {canViewFinancialDetails && (
            <>
              <SummaryItem
                label="Nivel de socios comerciales"
                value={`${operation.nivelesRedComercial} nivel${
                  operation.nivelesRedComercial > 1 ? 'es' : ''
                }`}
              />

              <SummaryItem
                label="Comisión por cada socio comercial"
                value={`${operation.porcentajeComisionAplicado}%`}
              />

              <SummaryItem
                label="Comisión oficina"
                value={`${operation.porcentajeComisionOficina}%`}
              />
            </>
          )}

          <SummaryItem
            label="Actualizada"
            value={
              shouldShowUpdatedAt
                ? formatDateTime(operation.updatedAt)
                : '-'
            }
          />
        </div>
      </div>

      {canViewFinancialDetails && (
        <>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Resumen financiero
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SummaryItem
                label="Porcentaje comisiones socios comerciales"
                value={`${operation.porcentajeComisionRedTotal}%`}
              />

              <SummaryItem
                label="Porcentaje comisión oficina"
                value={`${operation.porcentajeComisionOficinaTotal}%`}
              />

              <SummaryItem
                label="Porcentaje total descontado al cliente"
                value={`${
                  operation.porcentajeComisionOficinaTotal +
                  operation.porcentajeComisionRedTotal
                }%`}
              />

              <SummaryItem
                label="Total comisiones socios comerciales"
                value={formatCurrency(operation.montoComisionRedTotal)}
                variant="amber"
              />

              <SummaryItem
                label="Total comisión oficina"
                value={formatCurrency(operation.montoComisionOficinaTotal)}
                variant="emerald"
              />

              <SummaryItem
                label="Total descontado al cliente"
                value={formatCurrency(
                  operation.montoComisionOficinaTotal +
                    operation.montoComisionRedTotal,
                )}
                variant="blue"
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Retorno estimado al cliente
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-900">
              {formatCurrency(operation.montoTotalDevolverCliente)}
            </p>

            <p className="mt-2 text-sm text-amber-800">
              Monto calculado después de descontar comisiones de red y
              comisión de oficina.
            </p>
          </div>
        </>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Observaciones
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {operation.observaciones?.trim() ||
            'Sin observaciones registradas.'}
        </p>
      </div>
    </div>
  );
}