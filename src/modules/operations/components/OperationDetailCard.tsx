import { operationStatusLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDate,
} from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { OperationStatusBadge } from './OperationStatusBadge.js';
import { useMarkOperationAsInvoiced } from '../hooks/use-mark-operations-as-invoiced.js';
import { useLocation } from 'react-router-dom';
import { paths } from '@/routes/paths.js';

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
      container: 'border-blue-200 bg-blue-50',
      label: 'text-blue-700',
      value: 'text-blue-900',
    },
    amber: {
      container: 'border-amber-200 bg-amber-50',
      label: 'text-amber-700',
      value: 'text-amber-900',
    },
  };

  const styles = variants[variant];

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${styles.container} transition-all hover:-translate-y-0.5`}>
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

  const location = useLocation();

  const isReturnRequestDetail = location.pathname.startsWith(
    paths.returnsforrequest,
  );

  return (
    <div className="
rounded-[2rem]
border
border-slate-200/80
bg-white
p-8
shadow-lg
shadow-slate-950/5
">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Operación #{operation.id}
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Cliente: {operation.clienteNombre}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Registrada el {formatDate(operation.createdAt)}
          </p>
        </div>

        <div className="self-start">
          <OperationStatusBadge
            status={operation.estatus}
            isReturn={isReturnRequestDetail}
          />
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
            value={formatCurrency(operation.saldoPendientePorValidar)}
          />

          {canViewFinancialDetails && (
            <>
              <SummaryItem
                label="Nivel de socios comerciales"
                value={`${operation.nivelesRedComercial} nivel${operation.nivelesRedComercial > 1 ? 'es' : ''
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
                ? formatDate(operation.updatedAt)
                : '-'
            }
          />
        </div>
      </div>

      {canViewFinancialDetails && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Red comercial asignada
          </h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm p-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Configuración de red comercial
              </p>

              <p className="mt-2 text-sm text-slate-700">
                Esta operación utiliza{' '}
                <span className="font-semibold">
                  {operation.nivelesRedComercial}
                </span>{' '}
                {operation.nivelesRedComercial === 1
                  ? 'nivel de socios comerciales'
                  : 'niveles de socios comerciales'}
                .
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    N1
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Socio comercial nivel 1
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {operation.socioComercialNombre}
                    </p>
                  </div>
                </div>
              </div>

              {operation.socioComercialNivel2Nombre && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      N2
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Socio comercial nivel 2
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {operation.socioComercialNivel2Nombre}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {operation.socioComercialNivel3Nombre && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      N3
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Socio comercial nivel 3
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {operation.socioComercialNivel3Nombre}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {canViewFinancialDetails && (
        <>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Resumen financiero
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SummaryItem
                label="Porcentaje comisiones socios comerciales"
                value={`${operation.porcentajeComisionRedTotal}% (${operation.porcentajeComisionAplicado}% a cada uno)`}
              />

              <SummaryItem
                label="Porcentaje comisión oficina"
                value={`${operation.porcentajeComisionOficinaTotal}%`}
              />

              <SummaryItem
                label={
                  operation.estatus === 'COMPLETADA'
                    ? 'Porcentaje total descontado al cliente'
                    : 'Porcentaje total a descontar al cliente'
                }
                value={`${operation.porcentajeComisionOficinaTotal +
                  operation.porcentajeComisionRedTotal
                  }%`}
              />

              <SummaryItem
                label="Total comisiones socios comerciales"
                value={formatCurrency(operation.montoComisionRedTotal) + ` ($${operation.montoComisionRedTotal / operation.nivelesRedComercial} a cada uno)`}
                variant="amber"
              />

              <SummaryItem
                label="Total comisión oficina"
                value={formatCurrency(operation.montoComisionOficinaTotal)}
                variant="emerald"
              />

              <SummaryItem
                label={
                  operation.estatus === 'COMPLETADA'
                    ? 'Total descontado al cliente'
                    : 'Total a descontar al cliente'
                }
                value={formatCurrency(
                  operation.montoComisionOficinaTotal +
                  operation.montoComisionRedTotal,
                )}
                variant="blue"
              />
            </div>
          </div>

          <div
            className="
    mt-6
    rounded-[2rem]
    border
    border-blue-200
    bg-gradient-to-br
    from-blue-50
    to-slate-50
    p-5
    shadow-sm
  "
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Retorno estimado al cliente
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {formatCurrency(operation.montoTotalDevolverCliente)}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Monto calculado después de descontar comisiones de socios comerciales y
              comisión de oficina.
            </p>
          </div>
        </>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80
shadow-sm p-4">
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