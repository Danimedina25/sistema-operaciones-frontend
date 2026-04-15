import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { CreateOperationForm } from '@/modules/operations/components/CreateOperationForm';
import { OperationsFilters } from '@/modules/operations/components/OperationsFilters';
import { OperationsTable } from '@/modules/operations/components/OperationsTable';
import { useCreateOperation } from '@/modules/operations/hooks/use-create-operation';
import { useOperations } from '@/modules/operations/hooks/use-operations';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { getTotalPages, paginateItems } from '@/shared/utils/pagination';
import { AddOperationPaymentForm } from '@/modules/operations/components/AddOperationPaymentForm';
import { useAddOperationPayment } from '@/modules/operations/hooks/use-add-operation-payment';
import {
  filterOperations,
  type OperationsFilters as OperationsFiltersType,
} from '@/modules/operations/utils/operations-filters';
import { buildOperationDetailPath } from '@/routes/paths';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { useFrequentClientNames } from '../hooks/use-frequently-client-names.js';

const initialFilters: OperationsFiltersType = {
  search: '',
  status: 'ALL',
};

export default function OperationsPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<OperationsFiltersType>(initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<PaymentOperationResponse | null>(null);
  const { clientNames: frequentClientNames } = useFrequentClientNames();
  const [currentPage, setCurrentPage] = useState(1);
  

  const pageSize = 10;

  const { operations, isLoading, fetchOperations } = useOperations();

  const { isSubmitting: isSubmittingPayment, submitAddOperationPayment } =
  useAddOperationPayment({
    onSuccess: async () => {
      setIsAddPaymentModalOpen(false);
      setSelectedOperation(null);
      await fetchOperations();
    },
  });

function handleOpenAddPayment(operationId: number) {
  const operation = operations.find((item) => item.id === operationId);

  if (!operation) {
    return;
  }

  setSelectedOperation(operation);
  setIsAddPaymentModalOpen(true);
}
  const {
    accounts: bankAccountsCatalog,
    isLoading: isLoadingBankAccounts,
  } = useBankAccounts();

  const bankAccounts = useMemo(() => {
    return bankAccountsCatalog
      .filter((account) => account.activo)
      .map((account) => ({
        id: account.id,
        label: `${account.banco} - ${account.titular} - ${account.numeroCuenta}`,
      }));
  }, [bankAccountsCatalog]);

  const { isSubmitting, submitCreateOperation } = useCreateOperation({
    onSuccess: async (operationId) => {
      setIsCreateModalOpen(false);
      await fetchOperations();
      navigate(buildOperationDetailPath(operationId));
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredOperations = useMemo(() => {
    return filterOperations(operations, filters);
  }, [operations, filters]);

  const totalPages = useMemo(() => {
    return getTotalPages(filteredOperations.length, pageSize);
  }, [filteredOperations.length, pageSize]);

  const paginatedOperations = useMemo(() => {
    return paginateItems(filteredOperations, currentPage, pageSize);
  }, [filteredOperations, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Operaciones</h1>
          <p className="mt-2 text-sm text-slate-500">
            Consulta operaciones registradas y crea nuevas operaciones del sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Nueva operación
        </button>
      </div>

      <OperationsFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Cargando operaciones...
        </div>
      ) : (
        <>
         <OperationsTable
            operations={paginatedOperations}
            onViewDetail={(id) => navigate(buildOperationDetailPath(id))}
            onAddPayment={handleOpenAddPayment}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <Modal
        open={isCreateModalOpen}
        title="Crear nueva operación"
        onClose={() => setIsCreateModalOpen(false)}
      >
        {isLoadingBankAccounts ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Cargando cuentas bancarias...
          </div>
        ) : (
          <CreateOperationForm
            isSubmitting={isSubmitting}
            bankAccounts={bankAccounts}
            clientSuggestions={frequentClientNames}
            onSubmit={submitCreateOperation}
          />
        )}
      </Modal>

      <Modal
        open={isAddPaymentModalOpen}
        title="Registrar pago"
        onClose={() => {
          setIsAddPaymentModalOpen(false);
          setSelectedOperation(null);
        }}
      >
        {isLoadingBankAccounts || selectedOperation === null ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Cargando formulario...
          </div>
        ) : (
         <AddOperationPaymentForm
          isSubmitting={isSubmittingPayment}
          bankAccounts={bankAccounts}
          montoTotal={selectedOperation.montoTotal}
          montoValidado={selectedOperation.montoValidado}
          saldoPendiente={selectedOperation.saldoPendiente}
          onSubmit={(values) =>
            submitAddOperationPayment(selectedOperation.id, values)
          }
        />
        )}
      </Modal>
    </div>
  );
}