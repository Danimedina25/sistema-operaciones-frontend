import { useState } from 'react';
import { Pagination } from '@/shared/components/ui/Pagination';
import { QueryState } from '@/shared/components/ui/QueryState';
import { useTableFilters } from '@/shared/hooks/use-table-filters';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { BankMovementsFilters } from '../components/BankMovementsFilters';
import { BankMovementsSummary } from '../components/BankMovementsSummary';
import { BankMovementsTable } from '../components/BankMovementsTable';
import { BANK_MOVEMENTS_PAGE_SIZE, todayIso, useBankMovements } from '../hooks/use-bank-movements';
import type { BankMovementFilters } from '../types/bank-movements.types';

function defaultFilters(): BankMovementFilters {
  const today = todayIso();
  return { desde: today, hasta: today, bankAccountId: null, banco: '', direccion: '', tipo: '' };
}

/**
 * Historial general de movimientos bancarios.
 *
 * Es una vista estrictamente de consulta: reúne los pagos validados, los retornos
 * completados y los cheques cobrados en Caja General, que son las tres fuentes que mueven
 * una cuenta bancaria. No ofrece captura manual porque un movimiento bancario sin origen
 * no existe.
 */
export function BankMovementsPage() {
  const { filters, setFilters } = useTableFilters<BankMovementFilters>('table-filters:bank-movements', defaultFilters());
  // La página se guarda junto a los filtros a los que pertenece: al cambiar un filtro
  // cambia el universo consultado y la paginación vuelve al inicio, sin efectos en cascada.
  const [pagination, setPagination] = useState({ filters, page: 0 });
  const page = pagination.filters === filters ? pagination.page : 0;
  const setPage = (next: number) => setPagination({ filters, page: next });

  const { accounts, isLoading: loadingAccounts } = useBankAccounts();
  const { movements, totals, enabled } = useBankMovements(filters, page);

  const content = movements.data?.content ?? [];
  const rangeProblem = !enabled
    ? 'Selecciona un rango de fechas ordenado y que no sea futuro.'
    : null;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Movimientos bancarios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulta del movimiento de las cuentas bancarias: pagos validados, retornos
          completados y cheques cobrados en Caja General.
        </p>
      </header>

      <BankMovementsFilters
        filters={filters}
        onChange={setFilters}
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
