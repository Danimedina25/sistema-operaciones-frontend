import { operationStatusLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { OperationStatusBadge } from './OperationStatusBadge.js';
import { OperationStatus } from '../types/operations.types.ts';
import { useMarkOperationAsInvoiced } from '../hooks/use-mark-operations-as-invoiced.js';

interface OperationDetailCardProps {
  operation: PaymentOperationResponse;
  canViewFinancialDetails: boolean;
   onOperationUpdated?: () => void | Promise<void>;
}

function SummaryItem({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          accent ? 'text-emerald-700' : 'text-slate-500'
        }`}
      >
        {label}
      </p>
      <div
        className={`mt-2 text-sm font-medium ${
          accent ? 'text-emerald-900' : 'text-slate-900'
        }`}
      >
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

          {canViewFinancialDetails && operation.estatus === 'VALIDADA' && (
            <button
              type="button"
              onClick={() => submitMarkAsInvoiced(operation.id)}
              disabled={processingOperationId === operation.id}
              className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processingOperationId === operation.id
                ? 'Facturando...'
                : 'Marcar como facturada'}
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* <SummaryItem label="Cliente primario" value={operation.clienteNombre} /> */}

          
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
            value={operationStatusLabels[operation.estatus] ?? operation.estatus}
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
                label="Porcentaje total comisión socios comerciales"
                value={`${operation.porcentajeComisionRedTotal}%`}
              />
              <SummaryItem
                label="Comisión total socios comerciales"
                value={formatCurrency(operation.montoComisionRedTotal)}
              />
              <SummaryItem
                label="Comisión total oficina"
                value={formatCurrency(operation.montoComisionOficinaTotal)}
              />
              <SummaryItem
                label="Porcentaje comisión oficina"
                value={`${operation.porcentajeComisionOficinaTotal}%`}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Retorno estimado al cliente
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {formatCurrency(operation.montoTotalDevolverCliente)}
            </p>
            <p className="mt-2 text-sm text-emerald-800">
              Monto calculado después de descontar comisiones de red y comisión de oficina.
            </p>
          </div>
        </>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Observaciones
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {operation.observaciones?.trim() || 'Sin observaciones registradas.'}
        </p>
      </div>
    </div>
  );
}