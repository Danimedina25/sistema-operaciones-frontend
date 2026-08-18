import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getMyOperations, getOperationsWithRequestedReturns } from '@/modules/operations/api/operations.api';
import { getMyWeeklyCommissions } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { resolveDateFilterRange } from '@/shared/utils/date-filter-range';
import type { OperationsFilters } from '@/modules/operations/types/operations.types.ts';

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

export interface SocioPendingSummary {
  rejectedPayments: number | null;
  pendingToRegister: number | null;
  readyToRequestReturn: number | null;
  returnsPendingConfirmation: number | null;
  pendingCommissions: number | null;
}

const EMPTY_SUMMARY: SocioPendingSummary = {
  rejectedPayments: null,
  pendingToRegister: null,
  readyToRequestReturn: null,
  returnsPendingConfirmation: null,
  pendingCommissions: null,
};

export interface SocioPendingSummaryParams {
  dateFilter: OperationsFilters['dateFilter'];
  startDate: string;
  endDate: string;
}

/**
 * Contadores de pendientes para el SOCIO_COMERCIAL autenticado, calculados
 * con `totalElements` real del servidor (nunca sobre una sola página).
 * "Comprobantes rechazados" cuenta operaciones con al menos un pago
 * rechazado (el backend no expone conteo a nivel de pago individual).
 * Respeta el mismo filtro de fecha (dateFilter/startDate/endDate) que la
 * tabla principal de operaciones.
 */
export function useSocioPendingSummary({
  dateFilter,
  startDate,
  endDate,
}: SocioPendingSummaryParams) {
  const { hasRole } = useAuth();
  const enabled = hasRole(['SOCIO_COMERCIAL']);

  const [summary, setSummary] = useState<SocioPendingSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchSummary = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const dateFilters = { dateFilter, startDate, endDate };
      const commissionsRange = resolveDateFilterRange(dateFilter, startDate, endDate);

      const [
        rejected,
        pendingValidation,
        pendingIngresoParcial,
        readyForReturn,
        returnsAwaitingConfirmation,
        weeklyCommissions,
      ] = await Promise.all([
        getMyOperations(0, 1, { ...BASE_FILTERS, ...dateFilters, paymentStatus: 'RECHAZADA' }),
        getMyOperations(0, 1, { ...BASE_FILTERS, ...dateFilters, status: 'PENDIENTE_VALIDACION' }),
        getMyOperations(0, 1, { ...BASE_FILTERS, ...dateFilters, status: 'INGRESO_PARCIAL' }),
        getMyOperations(0, 1, { ...BASE_FILTERS, ...dateFilters, status: 'VALIDADA' }),
        getOperationsWithRequestedReturns(0, 1, { ...BASE_FILTERS, ...dateFilters, returnStatuses: 'ENTREGADO' }),
        getMyWeeklyCommissions(commissionsRange),
      ]);

      const pendingCommissions = weeklyCommissions.operaciones.filter(
        (operacion) => operacion.myCommissionStatus === 'GENERADA',
      ).length;

      setSummary({
        rejectedPayments: rejected.totalElements,
        pendingToRegister: pendingValidation.totalElements + pendingIngresoParcial.totalElements,
        readyToRequestReturn: readyForReturn.totalElements,
        returnsPendingConfirmation: returnsAwaitingConfirmation.totalElements,
        pendingCommissions,
      });
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, dateFilter, startDate, endDate]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, enabled, refetch: fetchSummary };
}
