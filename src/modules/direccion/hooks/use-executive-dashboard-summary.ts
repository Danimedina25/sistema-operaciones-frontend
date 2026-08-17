import { useCallback, useEffect, useState } from 'react';
import { getOperations, getOperationsWithRequestedReturns } from '@/modules/operations/api/operations.api';
import { getPaidCommissions, getSummary } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { calculateDailyCashCut } from '@/modules/corte/api/corte.api';
import { formatDate } from '@/shared/utils/weeks';
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
}

const EMPTY_SUMMARY: ExecutiveDashboardSummary = {
  volumenOperado: null,
  saldoBancario: null,
  retornosPendientes: null,
  comisionesPagadas: null,
  operacionesCompletadas: null,
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

      const [completed, returnsPending, commissionSummary, paidCommissions, dailyCut] =
        await Promise.all([
          getOperations(0, 1, { ...periodFilters, status: 'COMPLETADA' }),
          getOperationsWithRequestedReturns(0, 1, periodFilters),
          getSummary({ startDate: period.startDate, endDate: period.endDate }),
          getPaidCommissions({ startDate: period.startDate, endDate: period.endDate }),
          calculateDailyCashCut(formatDate(new Date())),
        ]);

      const volumenOperado = commissionSummary.operaciones.reduce(
        (sum, operacion) => sum + operacion.montoOperacion,
        0,
      );

      setSummary({
        volumenOperado,
        saldoBancario: dailyCut.saldoFinal,
        retornosPendientes: returnsPending.totalElements,
        comisionesPagadas: paidCommissions.totalPagadas,
        operacionesCompletadas: completed.totalElements,
      });
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
