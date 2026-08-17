import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getMyOperations, getOperationsWithRequestedReturns } from '@/modules/operations/api/operations.api';
import { getMyWeeklyCommissions } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import { formatDate } from '@/shared/utils/weeks';
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

function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  return { startDate: formatDate(sunday), endDate: formatDate(saturday) };
}

/**
 * Contadores de pendientes para el SOCIO_COMERCIAL autenticado, calculados
 * con `totalElements` real del servidor (nunca sobre una sola página).
 * "Comprobantes rechazados" cuenta operaciones con al menos un pago
 * rechazado (el backend no expone conteo a nivel de pago individual).
 */
export function useSocioPendingSummary() {
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
      const { startDate, endDate } = getCurrentWeekRange();

      const [
        rejected,
        pendingValidation,
        pendingIngresoParcial,
        readyForReturn,
        returnsAwaitingConfirmation,
        weeklyCommissions,
      ] = await Promise.all([
        getMyOperations(0, 1, { ...BASE_FILTERS, paymentStatus: 'RECHAZADA' }),
        getMyOperations(0, 1, { ...BASE_FILTERS, status: 'PENDIENTE_VALIDACION' }),
        getMyOperations(0, 1, { ...BASE_FILTERS, status: 'INGRESO_PARCIAL' }),
        getMyOperations(0, 1, { ...BASE_FILTERS, status: 'VALIDADA' }),
        getOperationsWithRequestedReturns(0, 1, { ...BASE_FILTERS, returnStatuses: 'ENTREGADO' }),
        getMyWeeklyCommissions({ startDate, endDate }),
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
  }, [enabled]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, enabled, refetch: fetchSummary };
}
