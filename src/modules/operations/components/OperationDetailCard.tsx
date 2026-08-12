import { operationStatusLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDate,
  isOperationEditableStatus,
} from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { OperationStatusBadge } from './OperationStatusBadge.js';
import { useMarkOperationAsInvoiced } from '../hooks/use-mark-operations-as-invoiced.js';
import { useLocation } from 'react-router-dom';
import { paths } from '@/routes/paths.js';
import { useAuth } from '@/modules/auth/store/auth.context';
import { BriefcaseBusiness, CalendarDays, CircleDollarSign, ReceiptText, TrendingDown } from 'lucide-react';

interface OperationDetailCardProps {
  operation: PaymentOperationResponse;
  canViewFinancialDetails: boolean;
  canViewOperationExtras: boolean;
  onOperationUpdated?: () => void | Promise<void>;
}

function SummaryItem({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'emerald' | 'blue' | 'amber' | 'dark';
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
      container: 'border-amber-200/80 bg-amber-50/70',
      label: 'text-amber-700',
      value: 'text-amber-950',
    },
    dark: {
      container: 'border-slate-700 bg-slate-800/80',
      label: 'text-slate-400',
      value: 'text-white',
    },
  };

  const styles = variants[variant];

  return (
    <div className={`rounded-2xl border p-4 ${styles.container}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${styles.label}`}>
        {label}
      </p>

      <div className={`mt-2 text-base font-semibold tabular-nums ${styles.value}`}>
        {value}
      </div>
    </div>
  );
}

export function OperationDetailCard({
  operation,
  canViewFinancialDetails,
  canViewOperationExtras,
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

  const { hasRole } = useAuth();
  const canReviewCommission = hasRole(['ADMIN', 'GERENTE', 'DIRECCION']);

  const location = useLocation();

  const isReturnRequestDetail = location.pathname.startsWith(
    paths.returnsforrequest,
  );

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/[0.06]">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-white md:px-8 md:py-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-300">
                <ReceiptText className="h-3.5 w-3.5" />
                FOLIO #{operation.id}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(operation.createdAt)}
              </span>
            </div>
            <h2 className="mt-4 truncate text-2xl font-bold tracking-tight md:text-3xl">
              {operation.clienteNombre}
            </h2>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-400">
              <BriefcaseBusiness className="h-4 w-4" />
              Socio comercial: <span className="font-medium text-slate-200">{operation.socioComercialNombre}</span>
            </p>
          </div>

          <div className="self-start rounded-xl bg-white p-1 shadow-lg">
          <OperationStatusBadge
            status={operation.estatus}
            isReturn={isReturnRequestDetail}
          />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem label="Monto de la operación" value={formatCurrency(operation.montoTotal)} variant="dark" />
          <SummaryItem label="Ingreso validado" value={formatCurrency(operation.montoValidado)} variant="dark" />
          <SummaryItem label="Pendiente por validar" value={formatCurrency(operation.saldoPendientePorValidar)} variant="dark" />
          <SummaryItem label="Retorno al cliente" value={formatCurrency(operation.montoTotalDevolverCliente)} variant="dark" />
        </div>
      </div>

      <div className="p-6 md:p-8">

      {canReviewCommission &&
        operation.nivelesRedComercial >= 2 &&
        isOperationEditableStatus(operation.estatus) && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            Esta operación tiene {operation.nivelesRedComercial} niveles de socios comerciales. Revisa si conviene personalizar los porcentajes de comisión al editarla.
          </p>
        </div>
      )}

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Datos de control
          </h3>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SummaryItem
            label="Socio comercial"
            value={operation.socioComercialNombre}
          />

          <SummaryItem
            label="Fecha de registro"
            value={formatDate(operation.createdAt)}
          />

          <SummaryItem
            label="Estatus"
            value={
              operationStatusLabels[operation.estatus] ?? operation.estatus
            }
          />

          <SummaryItem
            label="Pagos registrados"
            value={`${operation.pagos.length} comprobante${operation.pagos.length === 1 ? '' : 's'}`}
          />

          <SummaryItem
            label="Última actualización"
            value={shouldShowUpdatedAt ? formatDate(operation.updatedAt) : 'Sin cambios posteriores'}
          />

          {canViewFinancialDetails && (
            <>
              <SummaryItem
                label="Nivel de socios comerciales"
                value={`${operation.nivelesRedComercial} nivel${operation.nivelesRedComercial > 1 ? 'es' : ''
                  }`}
              />

              <SummaryItem
                label="Comisión por nivel de socio comercial"
                value={
                  <div className="space-y-0.5">
                    <div>Nivel 1: {operation.porcentajeComisionSocio}%</div>
                    {operation.nivelesRedComercial >= 2 && (
                      <div>Nivel 2: {operation.porcentajeComisionSocioNivel2}%</div>
                    )}
                    {operation.nivelesRedComercial >= 3 && (
                      <div>Nivel 3: {operation.porcentajeComisionSocioNivel3}%</div>
                    )}
                  </div>
                }
              />

              <SummaryItem
                label="Comisión oficina"
                value={`${operation.porcentajeComisionOficina}%`}
              />
            </>
          )}

        </div>
      </div>

      {canViewFinancialDetails && (
        <div className="mt-8 border-t border-slate-200 pt-7">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Red comercial asignada
          </h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-8 rounded-2xl bg-slate-950 p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400"><CircleDollarSign className="h-5 w-5" /></div>
              <div><h3 className="text-sm font-bold text-white">Resumen financiero</h3><p className="text-xs text-slate-400">Distribución de comisiones y descuentos</p></div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <SummaryItem
                label="Porcentaje comisiones socios comerciales"
                value={
                  <div className="space-y-0.5">
                    <div>Total: {operation.porcentajeComisionRedTotal}%</div>
                    <div className="text-xs font-normal">
                      N1: {operation.porcentajeComisionSocio}%
                      {operation.nivelesRedComercial >= 2 &&
                        ` · N2: ${operation.porcentajeComisionSocioNivel2}%`}
                      {operation.nivelesRedComercial >= 3 &&
                        ` · N3: ${operation.porcentajeComisionSocioNivel3}%`}
                    </div>
                  </div>
                }
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
                value={
                  <div className="space-y-0.5">
                    <div>{formatCurrency(operation.montoComisionRedTotal)}</div>
                    <div className="text-xs font-normal">
                      N1: {formatCurrency(operation.montoComisionSocioNivel1)}
                      {operation.nivelesRedComercial >= 2 &&
                        ` · N2: ${formatCurrency(operation.montoComisionSocioNivel2)}`}
                      {operation.nivelesRedComercial >= 3 &&
                        ` · N3: ${formatCurrency(operation.montoComisionSocioNivel3)}`}
                    </div>
                  </div>
                }
                variant="dark"
              />

              <SummaryItem
                label="Total comisión oficina"
                value={formatCurrency(operation.montoComisionOficinaTotal)}
                variant="dark"
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
                variant="dark"
              />
            </div>
          </div>

          <div
            className="
    mt-4
    rounded-2xl
    border
    border-blue-200
    bg-gradient-to-br
    from-blue-50
    to-slate-50
    p-5
  "
          >
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700"><TrendingDown className="h-4 w-4" />
              Retorno estimado al cliente
            </p>

            <p className="mt-2 text-3xl font-bold tabular-nums text-blue-950">
              {formatCurrency(operation.montoTotalDevolverCliente)}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Monto calculado después de descontar comisiones de socios comerciales y
              comisión de oficina.
            </p>
          </div>
        </>
      )}

      {canViewOperationExtras && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Observaciones
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            {operation.observaciones?.trim() ||
              'Sin observaciones registradas.'}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
