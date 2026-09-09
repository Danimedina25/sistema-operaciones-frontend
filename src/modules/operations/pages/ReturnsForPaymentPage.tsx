import { useUrlFilters } from '@/shared/hooks/use-url-filters';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pagination } from '@/shared/components/ui/Pagination';
import { TableFilterSection } from '@/shared/components/ui/TableFilterSection';
import { OperationsFilters } from '@/modules/operations/components/OperationsFilters';
import { useWorkOperations } from '../hooks/use-work-operations';
import { WorkQueueFilters } from '../components/WorkQueueFilters';
import { QueryState } from '@/shared/components/ui/QueryState';
import {
  OperationsFilters as OperationsFiltersType,
} from '../types/operations.types.ts';
import { ReturnsForPaymentTable } from '../components/returns/ReturnsForPaymentTable';
import { buildReturnsForPaymentDetailPath } from '@/routes/paths';
import { useTableCacheKey } from '@/shared/hooks/use-table-filters';


const initialFilters: OperationsFiltersType = {
  workQueue: '',
  operationId: 0,
  search: '',
  status: 'ALL',
  dateFilter: 'THIS_MONTH',
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


export default function ReturnsForPaymentPage() {
  const navigate = useNavigate();

  const { filters, setFilters } = useUrlFilters(initialFilters, useTableCacheKey('table-filters:returns-for-payment'));

  const [currentPage, setCurrentPage] = useState(0);

  const {
    data,
    isFetching: isLoading,
    error,
    refetch,
  } = useWorkOperations(filters, currentPage, true);

  const operations = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="space-y-3">
      <div className="relative flex items-center rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Retornos por pagar
          </h1>
          <p className="text-xs text-slate-500">
            Operaciones con saldo disponible para registrar otra parcialidad. Fechas por creación de la operación.
          </p>
        </div>
      </div>

      <TableFilterSection>
        <WorkQueueFilters filters={filters} onChange={(next) => { setFilters(next); setCurrentPage(0); }} returns />
        <OperationsFilters
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(0);
          }}
          showEstatusFilter={false}
        />
      </TableFilterSection>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Operaciones con retornos solicitados
          </h2>
          <p className="text-xs text-slate-500">
            Revisa las operaciones donde el socio comercial ya indicó cómo desea el retorno.
          </p>
        </div>

        <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
        <ReturnsForPaymentTable
          operations={operations}
          isLoading={isLoading}
          onReturnPayments={(operationId, scrollToReturns = true) => {
            navigate(buildReturnsForPaymentDetailPath(operationId), {
              state: {
                scrollToReturns,
              },
            });
          }}
        />

        </QueryState>
        <div className="mt-5">
          <Pagination
            currentPage={currentPage + 1}
            totalPages={totalPages}
            totalElements={totalElements}
            isLoading={isLoading}
            onPageChange={(page) => setCurrentPage(page - 1)}
          />
        </div>
      </section>
    </div>
  );
}
