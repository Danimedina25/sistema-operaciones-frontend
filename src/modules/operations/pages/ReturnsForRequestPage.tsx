import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pagination } from '@/shared/components/ui/Pagination';
import { OperationsFilters } from '@/modules/operations/components/OperationsFilters';
import { useOperationsAvailableToRequestReturn } from '../hooks/returns/use-operation-returns';
import {
  OperationsFilters as OperationsFiltersType,
  PaymentOperationResponse,
} from '../types/operations.types.ts';
import { ReturnsTable } from '../components/returns/ReturnsTable';
import { buildOperationDetailPath, buildReturnRequestDetailPath } from '@/routes/paths';
import { Modal } from '@/shared/components/ui/Modal';
import { RequestReturnForm } from '../components/returns/RequestReturnForm';


const initialFilters: OperationsFiltersType = {
  operationId: 0,
  search: '',
  status: 'ALL',
  dateFilter: 'THIS_MONTH',
  startDate: '',
  endDate: '',
};

const PAGE_SIZE = 10;

export default function ReturnsForRequestPage() {
  const navigate = useNavigate();

  const [filters, setFilters] =
    useState<OperationsFiltersType>(initialFilters);

  const [currentPage, setCurrentPage] = useState(0);

  const {
    data,
    isLoading,
    refetch,
  } = useOperationsAvailableToRequestReturn(currentPage, PAGE_SIZE, filters);

  const [isRequestReturnModalOpen, setIsRequestReturnModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] =
    useState<PaymentOperationResponse | null>(null);

  function handleOpenRequestReturn(operationId: number) {
    const operation = operations.find((item) => item.id === operationId);

    if (!operation) return;

    setSelectedOperation(operation);
    setIsRequestReturnModalOpen(true);
  }

  const operations = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="space-y-3">
      <div className="relative flex items-center rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Solicitud de retornos
          </h1>
          <p className="text-xs text-slate-500">
            Operaciones disponibles para indicar cómo se debe retornar el dinero al cliente.
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
        />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
         <h2 className="text-lg font-semibold text-slate-900">
            Operaciones disponibles para solicitar retorno
          </h2>
          <p className="text-xs text-slate-500">
            Selecciona una operación para dividir el retorno en uno o varios pagos según tipo de pago.
          </p>
        </div>

        <ReturnsTable
          operations={operations}
          isLoading={isLoading}
          onViewDetail={(operationId) => {
            navigate(buildReturnRequestDetailPath(operationId));
          }}
          onRequestReturn={handleOpenRequestReturn}
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

      <Modal
        open={isRequestReturnModalOpen}
        title="Solicitar retorno"
        onClose={() => {
          setIsRequestReturnModalOpen(false);
          setSelectedOperation(null);
        }}
      >
        {selectedOperation === null ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Cargando formulario...
          </div>
        ) : (
          <RequestReturnForm
            isSubmitting={false}
            montoTotalRetornar={selectedOperation.montoTotalDevolverCliente}
            clienteNombre={selectedOperation.clienteNombre}
            operationId={selectedOperation.id}
            onSubmit={async (values) => {
              console.log('Solicitud de retorno:', values);

              // Aquí después llamas tu hook/API:
              // await submitRequestReturn(selectedOperation.id, values);

              setIsRequestReturnModalOpen(false);
              setSelectedOperation(null);
              await refetch();
            }}
          />
        )}
      </Modal>
    </div>
  );
}