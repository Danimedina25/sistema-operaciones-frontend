import { useCallback, useEffect, useState } from 'react';
import { getOperations, getOperationsWithRequestedReturns, getStalledOperations } from '@/modules/operations/api/operations.api';
import { getPendingCommissions, getSummary } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
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

export interface GerenteDashboardSummary {
  operacionesCreadas: number | null;
  operacionesCompletadas: number | null;
  operacionesIngresoParcial: number | null;
  operacionesDetenidas: number | null;
  /**
   * Volumen operado en el periodo. Interpretación documentada: suma de
   * `montoOperacion` de las operaciones que ya generaron comisión (es
   * decir, validadas) en el periodo — no de todo lo creado, porque no
   * existe un endpoint de suma sobre el total de operaciones creadas.
   */
  montoOperado: number | null;
  pagosPendientes: number | null;
  retornosPendientes: number | null;
  comisionesPendientes: number | null;
}

const EMPTY_SUMMARY: GerenteDashboardSummary = {
  operacionesCreadas: null,
  operacionesCompletadas: null,
  operacionesIngresoParcial: null,
  operacionesDetenidas: null,
  montoOperado: null,
  pagosPendientes: null,
  retornosPendientes: null,
  comisionesPendientes: null,
};

export function useGerenteDashboardSummary(period: PeriodRange) {
  const [summary, setSummary] = useState<GerenteDashboardSummary>(EMPTY_SUMMARY);
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

      const [created, completed, pendingValidation, pendingIngresoParcial, returnsPending, commissionSummary, pendingCommissions, stalled] =
        await Promise.all([
          getOperations(0, 1, periodFilters),
          getOperations(0, 1, { ...periodFilters, status: 'COMPLETADA' }),
          getOperations(0, 1, { ...periodFilters, status: 'PENDIENTE_VALIDACION' }),
          getOperations(0, 1, { ...periodFilters, status: 'INGRESO_PARCIAL' }),
          getOperationsWithRequestedReturns(0, 1, periodFilters),
          getSummary({ startDate: period.startDate, endDate: period.endDate }),
          getPendingCommissions({ startDate: period.startDate, endDate: period.endDate }),
          getStalledOperations(0, 1, 48),
        ]);

      const montoOperado = commissionSummary.operaciones.reduce(
        (sum, operacion) => sum + operacion.montoOperacion,
        0,
      );

      setSummary({
        operacionesCreadas: created.totalElements,
        operacionesCompletadas: completed.totalElements,
        operacionesIngresoParcial: pendingIngresoParcial.totalElements,
        operacionesDetenidas: stalled.totalElements,
        montoOperado,
        pagosPendientes: pendingValidation.totalElements,
        retornosPendientes: returnsPending.totalElements,
        comisionesPendientes: pendingCommissions.totalPendientes,
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
