import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pagination } from '@/shared/components/ui/Pagination';
import { OperationsFilters } from '@/modules/operations/components/OperationsFilters';
import { useOperationsWithRequestedReturns } from '../hooks/returns/use-operation-returns';
import {
  OperationsFilters as OperationsFiltersType,
  PaymentOperationResponse,
} from '../types/operations.types.ts';
import { ReturnsForPaymentTable } from '../components/returns/ReturnsForPaymentTable';
import { buildReturnsForPaymentDetailPath } from '@/routes/paths';


const initialFilters: OperationsFiltersType = {
  operationId: 0,
  search: '',
  status: 'ALL',
  dateFilter: 'THIS_MONTH',
  startDate: '',
  endDate: '',
  activo: 'ACTIVE',
};

const PAGE_SIZE = 10;

export default function ReturnsForPaymentPage() {
  const navigate = useNavigate();

  const [filters, setFilters] =
    useState<OperationsFiltersType>(initialFilters);

  const [currentPage, setCurrentPage] = useState(0);

  const {
    data,
    isLoading,
    refetch,
  } = useOperationsWithRequestedReturns(currentPage, PAGE_SIZE, filters);

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
            Operaciones con retornos solicitados pendientes de pagar
          </p>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Filtros de búsqueda
          </h2>
        </div>

        <OperationsFilters
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(0);
          }}
          showEstatusFilter={false}
        />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Operaciones con retornos solicitados
          </h2>
          <p className="text-xs text-slate-500">
            Revisa las operaciones donde el socio comercial ya indicó cómo desea el retorno.
          </p>
        </div>

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