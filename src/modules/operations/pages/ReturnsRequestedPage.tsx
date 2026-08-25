import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pagination } from '@/shared/components/ui/Pagination';
import { CollapsibleFilterSection } from '@/shared/components/ui/CollapsibleFilterSection';
import { OperationsFilters } from '@/modules/operations/components/OperationsFilters';
import { useOperationsWithRequestedReturns } from '../hooks/returns/use-operation-returns';
import {
  OperationsFilters as OperationsFiltersType} from '../types/operations.types.ts';
import { buildReturnsRequestedDetailPath } from '@/routes/paths';
import { ReturnsRequestedTable } from '../components/returns/ReturnsRequestedTable';
import { useUrlFilters } from '@/shared/hooks/use-url-filters';


const initialFilters: OperationsFiltersType = {
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

const PAGE_SIZE = 10;

export default function ReturnsRequestedPage() {
  const navigate = useNavigate();

  const { filters, setFilters } = useUrlFilters<OperationsFiltersType>(initialFilters);

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
            Retornos solicitados
          </h1>
          <p className="text-xs text-slate-500">
            Operaciones con retornos solicitados y sus estatus
          </p>
        </div>
      </div>

      <CollapsibleFilterSection>
        <OperationsFilters
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(0);
          }}
          showEstatusFilter={false}
        />
      </CollapsibleFilterSection>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Operaciones con retornos solicitados
          </h2>
          <p className="text-xs text-slate-500">
            Revisa el estatus de los retornos solicitados de operaciones.
          </p>
        </div>

        <ReturnsRequestedTable
          operations={operations}
          isLoading={isLoading}
          goToReturns={(operationId, scrollToReturns = true) => {
            navigate(buildReturnsRequestedDetailPath(operationId), {
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
