import { useCallback, useEffect, useState } from 'react';
import { getOperations, getOperationsWithRequestedReturns } from '@/modules/operations/api/operations.api';
import { getPaidCommissions, getSummary } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { getOperatedMetrics } from '@/modules/gerente/api/management-metrics.api';
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

export interface ExecutiveDashboardSummary {
  volumenOperado: number | null;
  saldoBancario: number | null;
  retornosPendientes: number | null;
  comisionesPagadas: number | null;
  operacionesCompletadas: number | null;
  comisionesGeneradas: number | null;
  comisionesPendientes: number | null;
}

const EMPTY_SUMMARY: ExecutiveDashboardSummary = {
  volumenOperado: null,
  saldoBancario: null,
  retornosPendientes: null,
  comisionesPagadas: null,
  operacionesCompletadas: null,
  comisionesGeneradas: null,
  comisionesPendientes: null,
};

export function useExecutiveDashboardSummary(period: PeriodRange) {
  const [summary, setSummary] = useState<ExecutiveDashboardSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const periodFilters = {
        ...BASE_FILTERS,
        startDate: period.startDate,
        endDate: period.endDate,
      };

      const [completed, returnsPending, commissionSummary, paidCommissions, operated] =
        await Promise.allSettled([
          getOperations(0, 1, { ...periodFilters, status: 'COMPLETADA' }),
          getOperationsWithRequestedReturns(0, 1, periodFilters),
          getSummary({ startDate: period.startDate, endDate: period.endDate }),
          getPaidCommissions({ startDate: period.startDate, endDate: period.endDate }),
          getOperatedMetrics(period.startDate, period.endDate),
        ]);

      setSummary({
        volumenOperado: operated.status === 'fulfilled' ? operated.value.operatedAmount : null,
        saldoBancario: null,
        retornosPendientes: returnsPending.status === 'fulfilled' ? returnsPending.value.totalElements : null,
        comisionesPagadas: paidCommissions.status === 'fulfilled' ? paidCommissions.value.totalPagadas : null,
        operacionesCompletadas: completed.status === 'fulfilled' ? completed.value.totalElements : null,
        comisionesGeneradas: commissionSummary.status === 'fulfilled' ? commissionSummary.value.totalComisiones : null,
        comisionesPendientes: commissionSummary.status === 'fulfilled' ? commissionSummary.value.totalPendientes : null,
      });
      if ([completed, returnsPending, commissionSummary, paidCommissions, operated].every(result => result.status === 'rejected')) {
        setError(new Error('No se pudieron cargar los indicadores.'));
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [period.startDate, period.endDate]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, refetch: fetchSummary };
}
