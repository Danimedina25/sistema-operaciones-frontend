import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QuickFilters } from '@/shared/components/dashboard/QuickFilters';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { getOperations } from '@/modules/operations/api/operations.api';
import { getPendingCommissions } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { formatCurrency, formatDate, formatDateTime } from '@/modules/operations/utils/operation-formatters';
import { buildOperationDetailPath } from '@/routes/paths';
import { useLateReturns } from '@/modules/direccion/hooks/use-late-returns';
import { useStalledOperations } from '@/modules/gerente/hooks/use-stalled-operations';
import type { OperationsFilters } from '@/modules/operations/types/operations.types.ts';
import type { PeriodRange } from '@/modules/gerente/utils/period-range';

const BASE_FILTERS: OperationsFilters = {
  operationId: 0,
  search: '',
  status: 'ALL',
  dateFilter: '',
  startDate: '',
  endDate: '',
  activo: 'ACTIVE',
  paymentTypes: '',
  paymentStatus: '',
  returnStatuses: '',
  cuentaDestinoId: 0,
  banco: '',
  socioComercialId: 0,
};

type ExceptionCategory = 'ALL' | 'RECHAZADOS' | 'ATRASADOS' | 'DETENIDAS' | 'COMISIONES_PENDIENTES';

const CATEGORY_OPTIONS: Array<{ value: ExceptionCategory; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'RECHAZADOS', label: 'Comprobantes rechazados' },
  { value: 'ATRASADOS', label: 'Retornos atrasados' },
  { value: 'DETENIDAS', label: 'Operaciones detenidas' },
  { value: 'COMISIONES_PENDIENTES', label: 'Comisiones pendientes' },
];

interface ExceptionRow {
  id: string;
  category: Exclude<ExceptionCategory, 'ALL'>;
  categoryLabel: string;
  label: string;
  amount: number;
  dateLabel: string;
  linkTo: string;
}

interface ExceptionsListProps {
  period: PeriodRange;
}

export function ExceptionsList({ period }: ExceptionsListProps) {
  const [category, setCategory] = useState<ExceptionCategory>('ALL');
  const [rejectedRows, setRejectedRows] = useState<ExceptionRow[]>([]);
  const [pendingCommissionRows, setPendingCommissionRows] = useState<ExceptionRow[]>([]);
  const [isLoadingRejected, setIsLoadingRejected] = useState(true);
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(true);

  const { data: lateReturnsData, isLoading: isLoadingLate } = useLateReturns();
  const { data: stalledData, isLoading: isLoadingStalled } = useStalledOperations();

  useEffect(() => {
    let cancelled = false;
    setIsLoadingRejected(true);

    getOperations(0, 20, { ...BASE_FILTERS, paymentStatus: 'RECHAZADA' })
      .then((result) => {
        if (cancelled) return;
        setRejectedRows(
          result.content.map((operation) => ({
            id: `rechazado-${operation.id}`,
            category: 'RECHAZADOS' as const,
            categoryLabel: 'Comprobante rechazado',
            label: `Operación #${operation.id} — ${operation.clienteNombre}`,
            amount: operation.montoTotal,
            dateLabel: formatDate(operation.updatedAt),
            linkTo: buildOperationDetailPath(operation.id),
          })),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRejected(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCommissions(true);

    getPendingCommissions({ startDate: period.startDate, endDate: period.endDate })
      .then((result) => {
        if (cancelled) return;
        setPendingCommissionRows(
          result.operaciones
            .filter((operacion) => !operacion.pagadaCompletamente)
            .map((operacion) => ({
              id: `comision-${operacion.operationId}`,
              category: 'COMISIONES_PENDIENTES' as const,
              categoryLabel: 'Comisión pendiente',
              label: `Operación #${operacion.operationId} — ${operacion.cliente}`,
              amount: operacion.totalComisiones,
              dateLabel: formatDate(operacion.fechaOperacion),
              linkTo: buildOperationDetailPath(operacion.operationId),
            })),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCommissions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period.startDate, period.endDate]);

  const lateReturnRows: ExceptionRow[] = (lateReturnsData?.content ?? []).map((returnPayment) => ({
    id: `atrasado-${returnPayment.id}`,
    category: 'ATRASADOS' as const,
    categoryLabel: 'Retorno atrasado',
    label: `Retorno #${returnPayment.id} — Operación #${returnPayment.operationId}`,
    amount: returnPayment.monto,
    dateLabel: returnPayment.fechaHoraRecoleccionEfectivo
      ? formatDateTime(returnPayment.fechaHoraRecoleccionEfectivo)
      : '-',
    linkTo: buildOperationDetailPath(returnPayment.operationId),
  }));

  const stalledRows: ExceptionRow[] = (stalledData?.content ?? []).map((operation) => ({
    id: `detenida-${operation.id}`,
    category: 'DETENIDAS' as const,
    categoryLabel: 'Operación detenida',
    label: `Operación #${operation.id} — ${operation.clienteNombre}`,
    amount: operation.montoTotal,
    dateLabel: formatDate(operation.updatedAt),
    linkTo: buildOperationDetailPath(operation.id),
  }));

  const allRows = [...rejectedRows, ...lateReturnRows, ...stalledRows, ...pendingCommissionRows];
  const visibleRows = category === 'ALL' ? allRows : allRows.filter((row) => row.category === category);
  const isLoading = isLoadingRejected || isLoadingLate || isLoadingStalled || isLoadingCommissions;

  const countsByCategory = CATEGORY_OPTIONS.map((option) => ({
    ...option,
    count: option.value === 'ALL' ? allRows.length : allRows.filter((row) => row.category === option.value).length,
  }));

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Listado de excepciones</h2>
        <p className="text-xs text-slate-500">
          Comprobantes rechazados, retornos atrasados, operaciones detenidas y comisiones
          pendientes del periodo.
        </p>
      </div>

      <div className="mb-4">
        <QuickFilters
          options={countsByCategory.map((option) => ({
            value: option.value,
            label: option.label,
            count: option.count,
          }))}
          value={category}
          onChange={(value) => setCategory(value as ExceptionCategory)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando excepciones...</p>
      ) : visibleRows.length === 0 ? (
        <EmptyState title="Sin excepciones en esta categoría" />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Abrir</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {row.categoryLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.label}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.dateLabel}</td>
                  <td className="px-4 py-3">
                    <Link to={row.linkTo} className="text-xs font-semibold text-blue-600 hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
