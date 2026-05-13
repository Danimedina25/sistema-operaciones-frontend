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
import { AddOperationPaymentForm } from '@/modules/operations/components/AddOperationPaymentForm';
import { useAddOperationPayment } from '@/modules/operations/hooks/use-add-operation-payment';
import { buildOperationDetailPath } from '@/routes/paths';
import {
  OperationsFilters as OperationsFiltersType,
  PaymentOperationResponse,
} from '../types/operations.types.ts';
import { useFrequentClientNames } from '../hooks/use-frequently-client-names.js';
import { useClientes } from '@/modules/clientes/hooks/use-clientes.js';
import { useUpdateOperation } from '../hooks/use-update-operation.js';
import { UpdateOperationForm } from '../components/UpdateOperationForm.js';

const initialFilters: OperationsFiltersType = {
  operationId: 0,
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [operationToEdit, setOperationToEdit] =
    useState<PaymentOperationResponse | null>(null);

  const { clientNames: frequentClientNames } = useFrequentClientNames();
  const {
    clientes: clientesCatalog,
    isLoading: isLoadingClientes,
    fetchClientes
  } = useClientes();

  const { isSubmitting: isSubmittingUpdate, submitUpdateOperation } =
  useUpdateOperation({
    onSuccess: async () => {
      setIsEditModalOpen(false);
      setOperationToEdit(null);
      await fetchOperations(currentPage);
    },
  });

  useEffect(()=>{
    fetchClientes()
  }, [])
  const {
    operations,
    isLoading,
    fetchOperations,
    currentPage,
    totalPages,
    totalElements,
    setCurrentPage,
  } = useOperations(filters);

  const clientes = useMemo(() => {
    return clientesCatalog
      .filter((cliente) => cliente.activo)
      .map((cliente) => ({
        id: cliente.id,
        label: cliente.nombre,
      }));
  }, [clientesCatalog]);

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

  function handleOpenEditOperation(operationId: number) {
    const operation = operations.find((item) => item.id === operationId);

    if (!operation) return;

    const canEdit =
      operation.estatus === 'PENDIENTE_VALIDACION' ||
      operation.estatus === 'INGRESO_PARCIAL';

    if (!canEdit) return;

    setOperationToEdit(operation);
    setIsEditModalOpen(true);
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
    <div className="space-y-3">
      <div className="relative flex items-center rounded-2xl bg-white p-4 shadow-sm">

        {/* Botón (igual que lo tienes) */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Nueva operación
        </button>

        {/* Texto centrado real */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Operaciones
          </h1>
          <p className="text-xs text-slate-500">
            Gestiona operaciones y registra comprobantes
          </p>
        </div>

      </div>

    <section className="rounded-2xl bg-white p-4 shadow-sm">
     <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">
        Filtros de búsqueda
      </h2>
    </div>

      <OperationsFilters filters={filters} onChange={setFilters} />
    </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Listado de operaciones
          </h2>
        </div>

        <OperationsTable
          operations={operations}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setCurrentPage}
          onViewDetail={(id, scrollToPayments = false) => {
            navigate(buildOperationDetailPath(id), {
              state: {
                scrollToPayments,
              },
            });
          }}
          onAddPayment={handleOpenAddPayment}
          onEditOperation={handleOpenEditOperation}
          onOperationUpdated={() => fetchOperations(currentPage)}
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
        open={isCreateModalOpen}
        title="Nueva operación"
        onClose={() => setIsCreateModalOpen(false)}
      >
      {isLoadingBankAccounts || isLoadingClientes ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Cargando cuentas bancarias...
          </div>
        ) : (
          <CreateOperationForm
          isSubmitting={isSubmitting}
          bankAccounts={bankAccounts}
          clientes={clientes}
          onSubmit={submitCreateOperation}
        />
        )}
      </Modal>

      <Modal
        open={isEditModalOpen}
        title="Editar operación"
        onClose={() => {
          setIsEditModalOpen(false);
          setOperationToEdit(null);
        }}
      >
        {isLoadingClientes || operationToEdit === null ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Cargando formulario...
          </div>
        ) : (
          <UpdateOperationForm
            operation={operationToEdit}
            isSubmitting={isSubmittingUpdate}
            clientes={clientes}
            onSubmit={(values) =>
              submitUpdateOperation(operationToEdit.id, values)
            }
          />
        )}
      </Modal>

      <Modal
        open={isAddPaymentModalOpen}
        title="Registrar pago de ingreso"
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
            montoRegistrado={selectedOperation.montoRegistrado}
            saldoPendiente={selectedOperation.saldoPendientePorRegistrar}
            onSubmit={(values) =>
              submitAddOperationPayment(selectedOperation.id, values)
            }
          />
        )}
      </Modal>
    </div>
  );
}