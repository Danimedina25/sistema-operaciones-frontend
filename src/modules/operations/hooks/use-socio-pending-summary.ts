import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getMyOperations, getOperationsAvailableToRequestReturn, getOperationsWithRequestedReturns } from '@/modules/operations/api/operations.api';
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
}

const EMPTY_SUMMARY: SocioPendingSummary = {
  rejectedPayments: null,
  pendingToRegister: null,
  readyToRequestReturn: null,
  returnsPendingConfirmation: null,
};

export interface SocioPendingSummaryParams {
  dateFilter: OperationsFilters['dateFilter'];
  startDate: string;
  endDate: string;
}

/**
 * Contadores de pendientes para el SOCIO_COMERCIAL autenticado, calculados
 * con `totalElements` real del servidor (nunca sobre una sola página).
 * "Comprobantes rechazados" usa el estatus RECHAZADA de la operación,
 * igual que el botón de estatus del listado de destino.
 * Respeta el período independiente seleccionado en Mis pendientes.
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

      const [
        rejected,
        pendingIngresoParcial,
        readyForReturn,
        returnsAwaitingConfirmation,
      ] = await Promise.all([
        getMyOperations(0, 1, { ...BASE_FILTERS, ...dateFilters, status: 'RECHAZADA' }),
        getMyOperations(0, 1, { ...BASE_FILTERS, ...dateFilters, status: 'INGRESO_PARCIAL' }),
        getOperationsAvailableToRequestReturn(0, 1, { ...BASE_FILTERS, ...dateFilters }),
        getOperationsWithRequestedReturns(0, 1, { ...BASE_FILTERS, ...dateFilters, returnStatuses: 'EN_RECOLECCION' }),
      ]);

      setSummary({
        rejectedPayments: rejected.totalElements,
        pendingToRegister: pendingIngresoParcial.totalElements,
        readyToRequestReturn: readyForReturn.totalElements,
        returnsPendingConfirmation: returnsAwaitingConfirmation.totalElements,
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
