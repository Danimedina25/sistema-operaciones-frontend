import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getOperations } from '@/modules/operations/api/operations.api';
import type { OperationsFilters } from '@/modules/operations/types/operations.types.ts';

const REFRESH_INTERVAL_MS = 30_000;

const BASE_FILTERS: OperationsFilters = {
  operationId: 0,
  search: '',
  status: 'ALL',
  dateFilter: '',
  startDate: '',
  endDate: '',
  activo: 'ACTIVE',
  paymentTypes: '',
  paymentStatus: 'PENDIENTE_VALIDACION',
  returnStatuses: '',
  cuentaDestinoId: 0,
  banco: '',
  socioComercialId: 0,
};

/**
 * Cuenta real (vía `totalElements` del servidor, no calculada sobre una
 * página) de operaciones con al menos un pago pendiente de validación del
 * tipo que le corresponde al rol actual: EFECTIVO para JEFA_CAJAS,
 * bancarios (TRANSFERENCIA/DEPOSITO/CHEQUE) para AUXILIAR_CUENTAS/JEFA_CUENTAS.
 * Para el resto de los roles no aplica (retorna `enabled: false`).
 */
export function usePendingPaymentsCount() {
  const { hasRole } = useAuth();
  const [count, setCount] = useState<number | null>(null);

  const isJefaCajas = hasRole(['JEFA_CAJAS']);
  const isCuentas = hasRole(['AUXILIAR_CUENTAS', 'JEFA_CUENTAS']);
  const enabled = isJefaCajas || isCuentas;
  const paymentTypes = isJefaCajas ? 'EFECTIVO' : 'TRANSFERENCIA,DEPOSITO,CHEQUE';

  const fetchCount = useCallback(async () => {
    if (!enabled) return;

    try {
      const result = await getOperations(0, 1, { ...BASE_FILTERS, paymentTypes });
      setCount(result.totalElements);
    } catch {
      setCount(null);
    }
  }, [enabled, paymentTypes]);

  useEffect(() => {
    if (!enabled) return;

    void fetchCount();

    const intervalId = window.setInterval(() => {
      void fetchCount();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, fetchCount]);

  return { count: enabled ? count : null, enabled, refetch: fetchCount };
}
