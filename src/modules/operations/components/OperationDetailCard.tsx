import { operationStatusLabels } from '@/modules/operations/constants/operations.constants';
import {
  isOperationEditableStatus,
} from '@/modules/operations/utils/operation-formatters';
import { formatMoney as formatCurrency, formatDate } from '@/shared/format';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { OperationStatusBadge } from './OperationStatusBadge.js';
import { useMarkOperationAsInvoiced } from '../hooks/use-mark-operations-as-invoiced.js';
import { useLocation } from 'react-router-dom';
import { paths } from '@/routes/paths.js';
import { useAuth } from '@/modules/auth/store/auth.context';
import { useWhatsAppLink } from '@/shared/hooks/use-whatsapp-link';
import { buildOperationShareMessage } from '@/shared/utils/whatsapp-message';
import { BriefcaseBusiness, CalendarDays, CircleDollarSign, MessageCircle, ReceiptText, TrendingDown } from 'lucide-react';

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
  compact = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  variant?: 'default' | 'emerald' | 'blue' | 'amber' | 'dark';
  compact?: boolean;
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
    <div className={`min-w-0 rounded-xl border p-3 sm:rounded-2xl sm:p-4 ${compact ? 'max-sm:px-3 max-sm:py-2' : ''} ${styles.container}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${compact ? 'max-sm:text-[9px]' : ''} ${styles.label}`}>
        {label}
      </p>

      <div className={`mt-1.5 break-words text-sm font-semibold tabular-nums sm:mt-2 sm:text-base ${compact ? 'max-sm:mt-0.5 max-sm:text-base' : ''} ${styles.value}`}>
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
  const isSocio = hasRole(['SOCIO_COMERCIAL']);
  const canReviewCommission = hasRole(['ADMIN', 'GERENTE', 'DIRECCION']);
  const canShareViaWhatsApp = hasRole(['SOCIO_COMERCIAL', 'ADMIN', 'GERENTE', 'DIRECCION']);

  const location = useLocation();

  const isReturnRequestDetail = location.pathname.startsWith(
    paths.returnsforrequest,
  );

  const { openWhatsApp } = useWhatsAppLink();

  function handleShareViaWhatsApp() {
    const relevantPendingBalance =
      operation.saldoPendientePorRegistrar > 0
        ? `Saldo pendiente por registrar: ${formatCurrency(operation.saldoPendientePorRegistrar)}`
        : operation.saldoPendientePorValidar > 0
          ? `Saldo pendiente por validar: ${formatCurrency(operation.saldoPendientePorValidar)}`
          : operation.saldoPendienteRetornar > 0
            ? `Saldo pendiente por retornar: ${formatCurrency(operation.saldoPendienteRetornar)}`
            : null;

    const message = buildOperationShareMessage({
      operationId: operation.id,
      clienteNombre: operation.clienteNombre,
      montoTotal: operation.montoTotal,
      estatusLabel: operationStatusLabels[operation.estatus] ?? operation.estatus,
      saldoPendienteLabel: relevantPendingBalance,
    });

    openWhatsApp(message);
  }

  return (
    <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/[0.06] sm:rounded-[1.75rem] ${isSocio ? 'max-sm:rounded-2xl max-sm:border-0 max-sm:shadow-none' : ''}`}>
      <div className={`bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-5 text-white sm:px-6 sm:py-6 md:px-8 md:py-7 ${isSocio ? 'max-sm:relative max-sm:bg-slate-950 max-sm:py-4' : ''}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-5">
          <div className="min-w-0">
            <div className={`flex flex-wrap items-center justify-between gap-2 sm:justify-start sm:gap-3 ${isSocio ? 'max-sm:justify-start max-sm:gap-1' : ''}`}>
              <span className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-300 ${isSocio ? 'max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:font-normal max-sm:normal-case' : ''}`}>
                <ReceiptText className={`h-3.5 w-3.5 ${isSocio ? 'max-sm:hidden' : ''}`} />
                {isSocio ? <><span className="sm:hidden">Folio {operation.id}</span><span className="max-sm:hidden">FOLIO #{operation.id}</span></> : `FOLIO #${operation.id}`}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarDays className={`h-3.5 w-3.5 ${isSocio ? 'max-sm:hidden' : ''}`} />
                {isSocio && <span className="hidden max-sm:inline">·</span>}
                {formatDate(operation.createdAt)}
              </span>
            </div>
            <h2 className={`mt-4 break-words text-xl font-bold tracking-tight sm:text-2xl md:text-3xl ${isSocio ? 'max-sm:mt-2' : ''}`}>
              {operation.clienteNombre}
            </h2>
            <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 ${isSocio ? 'max-sm:gap-1' : ''}`}>
              <BriefcaseBusiness className={`h-4 w-4 ${isSocio ? 'max-sm:hidden' : ''}`} /><span className={isSocio ? 'max-sm:hidden' : ''}>Red:</span>
              <span className="rounded-full border border-blue-400/40 bg-blue-500/20 px-2.5 py-1 text-white"><span className={isSocio ? 'max-sm:hidden' : ''}>Nivel 1 · </span><span className="hidden max-sm:inline">N1 </span>{isSocio ? <><span className="sm:hidden">Tú</span><span className="max-sm:hidden">{operation.socioComercialNombre}</span></> : operation.socioComercialNombre}</span>
              {operation.socioComercialNivel2Nombre && <span title={operation.socioComercialNivel2Nombre} className="max-w-full truncate rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-white max-sm:max-w-[115px]"><span className={isSocio ? 'max-sm:hidden' : ''}>Nivel 2 · </span><span className="hidden max-sm:inline">N2 </span>{operation.socioComercialNivel2Nombre}</span>}
              {operation.socioComercialNivel3Nombre && <span title={operation.socioComercialNivel3Nombre} className="max-w-full truncate rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-white max-sm:max-w-[115px]"><span className={isSocio ? 'max-sm:hidden' : ''}>Nivel 3 · </span><span className="hidden max-sm:inline">N3 </span>{operation.socioComercialNivel3Nombre}</span>}
            </div>
          </div>

          <div className={`grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:w-auto md:grid-cols-1 md:justify-items-end ${isSocio ? 'max-sm:absolute max-sm:right-4 max-sm:top-4 max-sm:w-auto' : ''}`}>
            <div className={`w-full rounded-xl bg-white p-1 shadow-lg sm:w-auto ${isSocio ? 'max-sm:rounded-full max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none' : ''}`}>
              <OperationStatusBadge
                status={operation.estatus}
                isReturn={isReturnRequestDetail}
                className={isSocio ? 'max-sm:whitespace-nowrap sm:w-auto' : 'w-full sm:w-auto'}
              />
            </div>

            {canShareViaWhatsApp && (
              <button
                type="button"
                onClick={handleShareViaWhatsApp}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 sm:w-auto ${isSocio ? 'max-sm:hidden' : ''}`}
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                Compartir por WhatsApp
              </button>
            )}
          </div>
        </div>

        <div className={`mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 xl:grid-cols-4 ${isSocio ? 'max-sm:mt-3' : ''}`}>
          <SummaryItem label="Monto de la operación" value={formatCurrency(operation.montoTotal)} variant="dark" compact={isSocio} />
          <SummaryItem label="Ingreso validado" value={<span className={isSocio ? 'max-sm:text-emerald-400' : ''}>{formatCurrency(operation.montoValidado)}</span>} variant="dark" compact={isSocio} />
          <SummaryItem label="Retorno al cliente" value={formatCurrency(operation.montoTotalDevolverCliente)} variant="dark" compact={isSocio} />
          <SummaryItem label={isSocio ? <><span className="sm:hidden">{operation.saldoPendientePorRegistrar > 0 ? 'Por registrar' : operation.saldoPendientePorValidar > 0 ? 'Por validar' : operation.saldoPendientePorSolicitar > 0 ? 'Por solicitar' : 'Pendiente por retornar'}</span><span className="max-sm:hidden">Pendiente por retornar</span></> : 'Pendiente por retornar'} value={<><span className="sm:hidden text-amber-400">{formatCurrency(operation.saldoPendientePorRegistrar > 0 ? operation.saldoPendientePorRegistrar : operation.saldoPendientePorValidar > 0 ? operation.saldoPendientePorValidar : operation.saldoPendientePorSolicitar > 0 ? operation.saldoPendientePorSolicitar : operation.saldoPendienteRetornar)}</span><span className="max-sm:hidden">{formatCurrency(operation.saldoPendienteRetornar)}</span></>} variant="dark" compact={isSocio} />
        </div>
        {isSocio && canShareViaWhatsApp && <button type="button" onClick={handleShareViaWhatsApp} className="mt-3 hidden w-full items-center justify-center gap-2 rounded-xl border border-slate-600 py-2 text-xs font-medium text-white max-sm:inline-flex"><MessageCircle className="h-4 w-4 text-emerald-400" />Compartir por WhatsApp</button>}
      </div>

      <details className="border-t border-slate-200 p-4 sm:px-6">
        <summary className="cursor-pointer text-sm font-medium text-slate-600">Más información de la operación</summary>
        <div className="pt-5">

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
                value={`${operation.porcentajeComisionTotal}%`}
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
                value={formatCurrency(operation.montoComisionTotal)}
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
      </details>
    </div>
  );
}
