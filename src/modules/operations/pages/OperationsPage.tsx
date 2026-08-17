import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { useUrlFilters } from '@/shared/hooks/use-url-filters';
import { CreateOperationForm } from '@/modules/operations/components/CreateOperationForm';
import { OperationsFilters } from '@/modules/operations/components/OperationsFilters';
import { SocioPendingSummaryCards } from '@/modules/operations/components/SocioPendingSummaryCards';
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
import { isOperationEditableStatus } from '../utils/operation-formatters';
import { useClientes } from '@/modules/clientes/hooks/use-clientes.js';
import { useUpdateOperation } from '../hooks/use-update-operation.js';
import { UpdateOperationForm } from '../components/UpdateOperationForm.js';
import { useAuth } from '@/modules/auth/store/auth.context.js';
import { useCommercialPartners } from '@/modules/socioscomerciales/hooks/use-commercial-partners.js';
import { useConfiguracionGeneral } from '@/modules/configuraciones/hooks/use-configuracion-general';
import { useCommercialLevelOneUsers } from '@/modules/users/hooks/use-commercial-level-one-users';

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

export default function OperationsPage() {
  const navigate = useNavigate();

  const { filters, setFilters } = useUrlFilters<OperationsFiltersType>(initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<PaymentOperationResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [operationToEdit, setOperationToEdit] =
    useState<PaymentOperationResponse | null>(null);

  const { hasRole, user } = useAuth();
  const canCreateOperation = hasRole(['SOCIO_COMERCIAL', 'ADMIN']);
  const canReadConfiguracionGeneral = hasRole(['ADMIN', 'GERENTE', 'DIRECCION']);
  const showPaymentTypeFilter = !hasRole(['SOCIO_COMERCIAL']);

  const [searchParams] = useSearchParams();
  const appliedRoleDefaultFilter = useRef(false);
  const isJefaCajas = hasRole(['JEFA_CAJAS']);
  const isCuentas = hasRole(['AUXILIAR_CUENTAS', 'JEFA_CUENTAS']);

  useEffect(() => {
    if (appliedRoleDefaultFilter.current) return;
    appliedRoleDefaultFilter.current = true;

    // Si ya llegó con filtros en la URL (ej. desde un enlace de un
    // contador del dashboard), no se sobreescribe con el default de rol.
    if (searchParams.toString() !== '') return;

    if (isJefaCajas) {
      setFilters({ ...initialFilters, paymentTypes: 'EFECTIVO', paymentStatus: 'PENDIENTE_VALIDACION' });
    } else if (isCuentas) {
      setFilters({
        ...initialFilters,
        paymentTypes: 'TRANSFERENCIA,DEPOSITO,CHEQUE',
        paymentStatus: 'PENDIENTE_VALIDACION',
      });
    }
  }, [searchParams, isJefaCajas, isCuentas, setFilters]);
  const canAssignLevelOne = hasRole(['ADMIN']);
  const showSocioFilter = hasRole(['GERENTE', 'DIRECCION', 'ADMIN']);
  const {
    commercialLevelOneUsers,
    isLoading: isLoadingLevelOneUsers,
  } = useCommercialLevelOneUsers({ enabled: canAssignLevelOne || showSocioFilter });
  const canEditOperations = !hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS']);
  const needsOperationCatalogs = canCreateOperation || canEditOperations;

  const { clientNames: frequentClientNames } = useFrequentClientNames();
  const {
    clientes: clientesCatalog,
    isLoading: isLoadingClientes,
  } = useClientes({ enabled: needsOperationCatalogs });

  const { isSubmitting: isSubmittingUpdate, submitUpdateOperation } =
    useUpdateOperation({
      onSuccess: async () => {
        setIsEditModalOpen(false);
        setOperationToEdit(null);
        await fetchOperations(currentPage);
      },
    });

  const {
    commercialPartners: commercialPartnersCatalog,
  } = useCommercialPartners({ enabled: needsOperationCatalogs });

  const { configuracionGeneral } = useConfiguracionGeneral({
    enabled: canCreateOperation && canReadConfiguracionGeneral,
  });

  const commercialPartners = useMemo(() => {
    return commercialPartnersCatalog.filter((partner) => partner.activo);
  }, [commercialPartnersCatalog]);

  const {
    operations,
    isLoading,
    fetchOperations,
    currentPage,
    totalPages,
    totalElements,
    setCurrentPage,
    processingOperationId,
    handleActivate,
    handleDeactivate,
  } = useOperations(filters);

  const canReviewCommission = hasRole(['ADMIN', 'GERENTE', 'DIRECCION']);
  const hasOperationsNeedingCommissionReview =
    canReviewCommission &&
    operations.some(
      (op) => op.nivelesRedComercial >= 2 && isOperationEditableStatus(op.estatus),
    );

  const clientes = useMemo(() => {
    return clientesCatalog
      .filter((cliente) => cliente.activo)
      .map((cliente) => ({
        id: cliente.id,
        label: cliente.nombre,
        nivelesRedComercial: cliente.nivelesRedComercial,
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
      <SocioPendingSummaryCards />

      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">

        <div className="flex-1">
          {canCreateOperation && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Nueva operación
            </button>
          )}
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Operaciones
          </h1>
          <p className="text-xs text-slate-500">
            Gestiona operaciones y registra comprobantes
          </p>
        </div>

        <div className="flex-1" />

      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Filtros de búsqueda
          </h2>
        </div>

        <OperationsFilters
          filters={filters}
          onChange={setFilters}
          showPaymentTypeFilter={showPaymentTypeFilter}
          bankAccounts={bankAccountsCatalog}
          showSocioFilter={showSocioFilter}
          socios={commercialLevelOneUsers}
        />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Listado de operaciones
          </h2>

          {hasOperationsNeedingCommissionReview && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Hay operaciones en este listado con 2 o 3 niveles de socios comerciales (marcadas con el folio en círculo). Revisa si conviene personalizar los porcentajes de comisión al editarlas.
              </p>
            </div>
          )}
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
          onActivateOperation={handleActivate}
          onDeactivateOperation={handleDeactivate}
          togglingOperationId={processingOperationId}
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
        {isLoadingBankAccounts || isLoadingClientes || (canAssignLevelOne && isLoadingLevelOneUsers) ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Cargando cuentas bancarias...
          </div>
        ) : (
          <CreateOperationForm
            isSubmitting={isSubmitting}
            bankAccounts={bankAccounts}
            clientes={clientes}
            commercialPartners={commercialPartners}
            porcentajeComisionOficinaDefault={
              configuracionGeneral?.porcentajeComisionOficina ?? 1.5
            }
            levelOneUsers={commercialLevelOneUsers.map((item) => ({
              id: item.id,
              nombre: item.nombre,
              porcentajeComision: item.commercialSettings?.porcentajeComision ?? 0,
            }))}
            currentLevelOneId={canAssignLevelOne ? 0 : (user?.userId ?? 0)}
            currentLevelOneCommission={user?.porcentajeComision ?? 0}
            canAssignLevelOne={canAssignLevelOne}
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
            commercialPartners={commercialPartners}
            onSubmit={(values) =>
              submitUpdateOperation(
                operationToEdit.id,
                operationToEdit.socioComercialId,
                values,
              )
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
