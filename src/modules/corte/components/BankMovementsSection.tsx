import { useState } from 'react';
import { Pagination } from '@/shared/components/ui/Pagination';
import { QueryState } from '@/shared/components/ui/QueryState';
import { useTableFilters } from '@/shared/hooks/use-table-filters';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { BankMovementsFilters } from './BankMovementsFilters';
import { BankMovementsSummary } from './BankMovementsSummary';
import { BankMovementsTable } from './BankMovementsTable';
import { BANK_MOVEMENTS_PAGE_SIZE, useBankMovements } from '../hooks/use-bank-movements';
import type { BankMovementFilters, BankMovementSideFilters } from '../types/bank-movements.types';

function defaultSideFilters(): BankMovementSideFilters {
  return { bankAccountId: null, banco: '', direccion: '', tipo: '' };
}

/**
 * Historial general de movimientos bancarios.
 *
 * Es una vista estrictamente de consulta: reúne los pagos validados, los retornos
 * completados y los cheques cobrados en Caja General, que son las tres fuentes que mueven
 * una cuenta bancaria. No ofrece captura manual porque un movimiento bancario sin origen
 * no existe.
 *
 * El rango de fechas NO se captura aquí: llega desde la cabecera de Cortes y saldos, que
 * es la misma para las tres pestañas. Así cambiar de pestaña conserva el periodo que el
 * usuario venía consultando en lugar de reiniciarlo.
 */
export function BankMovementsSection({ desde, hasta }: { desde: string; hasta: string }) {
  const { filters: sideFilters, setFilters: setSideFilters } = useTableFilters<BankMovementSideFilters>(
    'table-filters:bank-movements',
    defaultSideFilters(),
  );

  const filters: BankMovementFilters = { ...sideFilters, desde, hasta };

  // La página se guarda junto a los filtros a los que pertenece: al cambiar un filtro
  // cambia el universo consultado y la paginación vuelve al inicio, sin efectos en cascada.
  // Se compara por valor y no por identidad porque `filters` se recompone en cada render
  // al fusionar las fechas de la cabecera con los filtros propios.
  const filterKey = [desde, hasta, sideFilters.bankAccountId, sideFilters.banco, sideFilters.direccion, sideFilters.tipo].join('|');
  const [pagination, setPagination] = useState({ filterKey, page: 0 });
  const page = pagination.filterKey === filterKey ? pagination.page : 0;
  const setPage = (next: number) => setPagination({ filterKey, page: next });

  const { accounts, isLoading: loadingAccounts } = useBankAccounts();
  const { movements, totals, enabled } = useBankMovements(filters, page);

  const content = movements.data?.content ?? [];
  const rangeProblem = !enabled
    ? 'Selecciona un rango de fechas ordenado y que no sea futuro.'
    : null;

  return (
    <section className="space-y-6">
      <BankMovementsFilters
        filters={sideFilters}
        onChange={setSideFilters}
        accounts={accounts}
        isLoadingAccounts={loadingAccounts}
      />

      {rangeProblem ? (
        <p role="alert" className="text-sm text-red-600">{rangeProblem}</p>
      ) : (
        <>
          <BankMovementsSummary totals={totals.data} isLoading={totals.isLoading} />

          <QueryState
            isLoading={movements.isLoading}
            error={movements.error}
            isEmpty={content.length === 0}
            onRetry={() => { void movements.refetch(); void totals.refetch(); }}
            loadingLabel="Cargando movimientos bancarios…"
            emptyTitle="Sin movimientos"
            emptyDescription="Ninguna cuenta bancaria registró movimiento con estos filtros."
          >
            <BankMovementsTable movements={content} />
          </QueryState>

          <Pagination
            currentPage={page + 1}
            totalPages={movements.data?.totalPages ?? 0}
            totalElements={movements.data?.totalElements ?? 0}
            isLoading={movements.isLoading}
            onPageChange={next => setPage(next - 1)}
          />
        </>
      )}
    </section>
  );
}

export { BANK_MOVEMENTS_PAGE_SIZE };
