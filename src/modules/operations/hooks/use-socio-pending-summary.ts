import { useQuery } from '@tanstack/react-query';
import { useOperationsAvailableToRequestReturn } from './returns/use-operation-returns';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getMyOperations, getOperationsWithRequestedReturns } from '@/modules/operations/api/operations.api';
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

  const filters = { ...BASE_FILTERS, dateFilter, startDate, endDate };
  // Misma clave, filtros y tamaño que la primera página de Retornos por solicitar.
  const readyForReturn = useOperationsAvailableToRequestReturn(0, 10, filters, enabled);
  const rejected = useQuery({
    queryKey: ['socio-pending-rejected', filters],
    queryFn: () => getMyOperations(0, 1, { ...filters, status: 'RECHAZADA' }),
    enabled,
  });
  const partialIncome = useQuery({
    queryKey: ['socio-pending-partial-income', filters],
    queryFn: () => getMyOperations(0, 1, { ...filters, status: 'INGRESO_PARCIAL' }),
    enabled,
  });
  const awaitingConfirmation = useQuery({
    queryKey: ['socio-pending-return-confirmation', filters],
    queryFn: () => getOperationsWithRequestedReturns(0, 1, { ...filters, returnStatuses: 'EN_RECOLECCION' }),
    enabled,
  });
  const summary: SocioPendingSummary = {
    rejectedPayments: rejected.data?.totalElements ?? null,
    pendingToRegister: partialIncome.data?.totalElements ?? null,
    readyToRequestReturn: readyForReturn.data?.totalElements ?? null,
    returnsPendingConfirmation: awaitingConfirmation.data?.totalElements ?? null,
  };
  const queries = [rejected, partialIncome, readyForReturn, awaitingConfirmation];
  return {
    summary,
    isLoading: queries.some((query) => query.isFetching),
    error: queries.find((query) => query.error)?.error ?? null,
    enabled,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
