import { operationStatusLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { OperationStatusBadge } from './OperationStatusBadge.js';

interface OperationDetailCardProps {
  operation: PaymentOperationResponse;
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

export function OperationDetailCard({ operation }: OperationDetailCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Operación #{operation.id}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {operation.clienteNombre}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Registrada el {formatDateTime(operation.createdAt)}
          </p>
        </div>

        <div className="self-start">
          <OperationStatusBadge status={operation.estatus} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryItem label="Cliente" value={operation.clienteNombre} />
        <SummaryItem
          label="Socio comercial"
          value={operation.socioComercialNombre}
        />
        <SummaryItem
          label="Cuenta destino"
          value={operation.cuentaDestinoBanco}
        />
        <SummaryItem
          label="Monto total"
          value={formatCurrency(operation.montoTotal)}
        />
        <SummaryItem
          label="Monto validado"
          value={formatCurrency(operation.montoValidado)}
        />
        <SummaryItem
          label="Saldo pendiente"
          value={formatCurrency(operation.saldoPendiente)}
        />
        <SummaryItem
          label="Estatus"
          value={operationStatusLabels[operation.estatus] ?? operation.estatus}
        />
        <SummaryItem
          label="Niveles de red socios comerciales"
          value={`${operation.nivelesRedComercial} nivel${
            operation.nivelesRedComercial > 1 ? 'es' : ''
          }`}
        />
        <SummaryItem
          label="Porcentaje de comisión aplicada a red"
          value={`${operation.porcentajeComisionAplicado}%`}
        />
        <SummaryItem label="Creada" value={formatDateTime(operation.createdAt)} />
        <SummaryItem
          label="Actualizada"
          value={formatDateTime(operation.updatedAt)}
        />
      </div>

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