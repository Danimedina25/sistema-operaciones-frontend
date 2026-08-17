import { useCallback, useEffect, useState } from 'react';
import { getOperations } from '@/modules/operations/api/operations.api';
import { getSummary } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { comparePeriods, type PeriodComparison } from '@/shared/utils/comparatives';
import { getComparativePeriodPairs } from '@/modules/direccion/utils/period-pairs';
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

export interface PeriodComparativeRow {
  label: string;
  volumen: PeriodComparison;
  completadas: PeriodComparison;
}

async function fetchPeriodMetrics(range: PeriodRange) {
  const filters = { ...BASE_FILTERS, startDate: range.startDate, endDate: range.endDate };

  const [completed, commissionSummary] = await Promise.all([
    getOperations(0, 1, { ...filters, status: 'COMPLETADA' }),
    getSummary({ startDate: range.startDate, endDate: range.endDate }),
  ]);

  const volumen = commissionSummary.operaciones.reduce(
    (sum, operacion) => sum + operacion.montoOperacion,
    0,
  );

  return { volumen, completadas: completed.totalElements };
}

export function usePeriodComparatives() {
  const [rows, setRows] = useState<PeriodComparativeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchComparatives = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pairs = getComparativePeriodPairs();

      const results = await Promise.all(
        pairs.map(async (pair) => {
          const [current, previous] = await Promise.all([
            fetchPeriodMetrics(pair.current),
            fetchPeriodMetrics(pair.previous),
          ]);

          return {
            label: pair.label,
            volumen: comparePeriods(current.volumen, previous.volumen),
            completadas: comparePeriods(current.completadas, previous.completadas),
          };
        }),
      );

      setRows(results);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchComparatives();
  }, [fetchComparatives]);

  return { rows, isLoading, error, refetch: fetchComparatives };
}
