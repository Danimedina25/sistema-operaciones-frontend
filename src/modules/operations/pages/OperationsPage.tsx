import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { CreateOperationForm } from '@/modules/operations/components/CreateOperationForm';
import { OperationsFilters } from '@/modules/operations/components/OperationsFilters';
import { OperationsTable } from '@/modules/operations/components/OperationsTable';
import { useCreateOperation } from '@/modules/operations/hooks/use-create-operation';
import { useOperations } from '@/modules/operations/hooks/use-operations';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { AddOperationPaymentForm } from '@/modules/operations/components/AddOperationPaymentForm';
import { useAddOperationPayment } from '@/modules/operations/hooks/use-add-operation-payment';
import { buildOperationDetailPath } from '@/routes/paths';
import {
  OperationsFilters as OperationsFiltersType,
  PaymentOperationResponse,
} from '../types/operations.types.ts';
import { useFrequentClientNames } from '../hooks/use-frequently-client-names.js';

const initialFilters: OperationsFiltersType = {
  search: '',
  status: 'ALL',
  dateFilter: 'THIS_MONTH',
  startDate: '',
  endDate: '',
};

export default function OperationsPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<OperationsFiltersType>(initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<PaymentOperationResponse | null>(null);

  const { clientNames: frequentClientNames } = useFrequentClientNames();

  const {
    operations,
    isLoading,
    fetchOperations,
    currentPage,
    totalPages,
    totalElements,
    setCurrentPage,
  } = useOperations(filters);

  const { isSubmitting: isSubmittingPayment, submitAddOperationPayment } =
    useAddOperationPayment({
      onSuccess: async () => {
        setIsAddPaymentModalOpen(false);
        setSelectedOperation(null);
        await fetchOperations(currentPage);
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
      await fetchOperations(currentPage);
      navigate(buildOperationDetailPath(operationId));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Operaciones</h1>
          <p className="mt-2 text-sm text-slate-500">
            Consulta operaciones registradas y crea nuevas operaciones y pagos.
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

      <OperationsTable
        operations={operations}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setCurrentPage}
        onViewDetail={(id) => navigate(buildOperationDetailPath(id))}
        onAddPayment={handleOpenAddPayment}
      />

      <Pagination
        currentPage={currentPage + 1}
        totalPages={totalPages}
        totalElements={totalElements}
        isLoading={isLoading}
        onPageChange={(page) => setCurrentPage(page - 1)}
      />

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