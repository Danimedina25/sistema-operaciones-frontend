import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/shared/components/ui/Modal';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { Pagination } from '@/shared/components/ui/Pagination';
import { useUrlFilters } from '@/shared/hooks/use-url-filters';
import { OperationsFilters } from '@/modules/operations/components/OperationsFilters';
import { OperationsTable } from '@/modules/operations/components/OperationsTable';
import { useOperations } from '@/modules/operations/hooks/use-operations';
import { searchStalledOperations } from '@/modules/operations/api/operations.api';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { AddOperationPaymentForm } from '@/modules/operations/components/AddOperationPaymentForm';
import { useAddOperationPayment } from '@/modules/operations/hooks/use-add-operation-payment';
import { buildOperationDetailPath, paths } from '@/routes/paths';
import {
  OperationsFilters as OperationsFiltersType,
  PaymentOperationResponse,
} from '../types/operations.types.ts';
import { isOperationEditableStatus } from '../utils/operation-formatters';
import { useClientes } from '@/modules/clientes/hooks/use-clientes.js';
import { useUpdateOperation } from '../hooks/use-update-operation.js';
import { UpdateOperationForm } from '../components/UpdateOperationForm.js';
import { useAuth } from '@/modules/auth/store/auth.context.js';
import { useCommercialPartners } from '@/modules/socioscomerciales/hooks/use-commercial-partners.js';
import { useCommercialLevelOneUsers } from '@/modules/users/hooks/use-commercial-level-one-users';
import { SearchFilterBar, type ActiveFilter } from '@/shared/components/ui/SearchFilterBar';
import { Tabs } from '@/shared/components/ui/Tabs';
import { formatAccount, formatDate, formatMoney } from '@/shared/format';
import { operationStatusLabels } from '@/modules/operations/constants/operations.constants';
import { DeleteConfirmationModal } from '@/shared/components/ui/DeleteConfirmationModal';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { useDeleteOperation } from '../hooks/use-delete-operation';

const initialFilters: OperationsFiltersType = {
  workQueue: '',
  supervisedRole: '',
  operationId: 0,
  search: '',
  status: 'ALL',
  dateFilter: '',
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

  const { hasRole, user } = useAuth();
  const isManager = hasRole(['GERENTE']);
  const [listView, setListView] = useState<'all' | 'pending' | 'stalled'>('all');
  const [stalledPage, setStalledPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stalledSearch, setStalledSearch] = useState('');
  // Cuentas solo trabaja ingresos bancarios; efectivo es responsabilidad de cajas.
  const hideCashPaymentType =
    hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS']) && !hasRole(['JEFA_CAJAS']);
  // Nueva clave: el caché anterior puede contener filtros impuestos por el rol.
  const { filters: savedFilters, setFilters } = useUrlFilters<OperationsFiltersType>(
    initialFilters,
    `table-filters:operations:v3:${user?.userId ?? 'anonymous'}`,
  );
  // Compatibilidad con enlaces y caché del antiguo select de comprobantes.
  const filters = useMemo<OperationsFiltersType>(() => ({
    ...savedFilters,
    status: !savedFilters.workQueue && savedFilters.status === 'ALL' && savedFilters.paymentStatus === 'RECHAZADA'
      ? 'RECHAZADA' : savedFilters.status,
    paymentStatus: '',
    paymentTypes: hideCashPaymentType && savedFilters.paymentTypes === 'EFECTIVO'
      ? '' : savedFilters.paymentTypes,
  }), [savedFilters, hideCashPaymentType]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStalledSearch(filters.search.trim());
      setStalledPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.search]);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<PaymentOperationResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [operationToEdit, setOperationToEdit] =
    useState<PaymentOperationResponse | null>(null);
  const [operationToDelete, setOperationToDelete] =
    useState<PaymentOperationResponse | null>(null);

  const canCreateOperation = hasRole(['SOCIO_COMERCIAL', 'ADMIN']);
  const showPaymentTypeFilter = !hasRole(['SOCIO_COMERCIAL']);

  const showSocioFilter = hasRole(['GERENTE', 'DIRECCION', 'ADMIN']);
  const queryFilters = useMemo<OperationsFiltersType>(() =>
    isManager && listView === 'pending'
      ? { ...filters, status: 'PENDIENTE_VALIDACION' }
      : filters,
  [filters, isManager, listView]);

  const {
    commercialLevelOneUsers,
    isLoading: isLoadingLevelOneUsers,
  } = useCommercialLevelOneUsers({ enabled: showSocioFilter && (filtersOpen || Boolean(filters.socioComercialId)) });
  const canEditOperations = hasRole([
    'ADMIN',
    'GERENTE',
    'DIRECCION',
    'SOCIO_COMERCIAL',
  ]);
  const needsOperationCatalogs = canEditOperations && isEditModalOpen;

  const {
    clientes: clientesCatalog,
    isLoading: isLoadingClientes,
  } = useClientes({ enabled: needsOperationCatalogs });

  const { isSubmitting: isSubmittingUpdate, submitUpdateOperation } =
    useUpdateOperation({
      onSuccess: async () => {
        setIsEditModalOpen(false);
        setOperationToEdit(null);
        await refreshVisibleOperations();
      },
    });

  const {
    commercialPartners: commercialPartnersCatalog,
  } = useCommercialPartners({ enabled: needsOperationCatalogs });


  const commercialPartners = useMemo(() => commercialPartnersCatalog.filter((partner) => partner.activo), [commercialPartnersCatalog]);

  const {
    operations,
    error: operationsError,
    isLoading,
    fetchOperations,
    currentPage,
    totalPages,
    totalElements,
    setCurrentPage,
    processingOperationId,
    handleActivate,
    handleDeactivate,
  } = useOperations(queryFilters, !(isManager && listView === 'stalled'));

  const stalledQuery = useQuery({
    queryKey: ['operations-list-stalled-search', user?.userId, stalledPage, stalledSearch],
    queryFn: () => searchStalledOperations(stalledSearch, stalledPage, 10),
    enabled: isManager && listView === 'stalled',
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
  const showingStalled = isManager && listView === 'stalled';
  const stalledRows = stalledQuery.data?.content ?? [];
  const visibleOperations = showingStalled
    ? stalledRows
    : operations;
  const visiblePage = showingStalled ? stalledPage : currentPage;
  const visibleTotalPages = showingStalled ? stalledQuery.data?.totalPages ?? 0 : totalPages;
  const visibleTotalElements = showingStalled ? stalledQuery.data?.totalElements ?? 0 : totalElements;
  const visibleIsLoading = showingStalled ? stalledQuery.isLoading : isLoading;
  const visibleError = showingStalled ? stalledQuery.error : operationsError;

  async function refreshVisibleOperations(): Promise<void> {
    if (showingStalled) await stalledQuery.refetch();
    else await fetchOperations(currentPage);
  }

  const { isDeleting, submitDeleteOperation } = useDeleteOperation({
    onSuccess: async () => {
      // Si se eliminó el último registro de la página, la actual queda vacía.
      if (visibleOperations.length === 1 && visiblePage > 0) {
        if (showingStalled) setStalledPage(visiblePage - 1);
        else setCurrentPage(visiblePage - 1);
        return;
      }
      await refreshVisibleOperations();
    },
    // El rechazo habitual es que el estatus cambió: hay que releer el listado
    // para que la acción deje de ofrecerse sobre datos viejos.
    onRejected: async () => {
      await refreshVisibleOperations();
    },
  });

  const canReviewCommission = hasRole(['ADMIN', 'GERENTE', 'DIRECCION']);
  const hasOperationsNeedingCommissionReview =
    canReviewCommission &&
    visibleOperations.some(
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
        await refreshVisibleOperations();
      },
    });

  function handleOpenAddPayment(operationId: number) {
    const operation = visibleOperations.find((item) => item.id === operationId);

    if (!operation) {
      return;
    }

    setSelectedOperation(operation);
    setIsAddPaymentModalOpen(true);
  }

  function handleOpenEditOperation(operationId: number) {
    const operation = visibleOperations.find((item) => item.id === operationId);

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
  } = useBankAccounts({ enabled: isAddPaymentModalOpen || (filtersOpen && !showingStalled) || Boolean(filters.cuentaDestinoId) });

  const bankAccounts = useMemo(() => {
    return bankAccountsCatalog
      .filter((account) => account.activo)
      .map((account) => ({
        id: account.id,
        label: `${account.banco} - ${account.titular} - ${account.numeroCuenta}`,
      }));
  }, [bankAccountsCatalog]);

  const activeFilters: ActiveFilter[] = [];
  if (filters.status !== 'ALL') activeFilters.push({
    key: 'status', label: operationStatusLabels[filters.status],
    onRemove: () => setFilters({ ...filters, status: 'ALL' }),
  });
  const dateFilterLabels: Record<string, string> = {
    TODAY: 'Hoy', THIS_WEEK: 'Esta semana', THIS_MONTH: 'Este mes', LAST_MONTH: 'Mes pasado',
  };
  if (filters.dateFilter) activeFilters.push({
    key: 'dateFilter', label: `Periodo: ${dateFilterLabels[filters.dateFilter] ?? filters.dateFilter}`,
    onRemove: () => setFilters({ ...filters, dateFilter: '' }),
  });
  if (filters.startDate || filters.endDate) activeFilters.push({
    key: 'dateRange', label: `Fecha: ${formatDate(filters.startDate)} – ${formatDate(filters.endDate)}`,
    onRemove: () => setFilters({ ...filters, startDate: '', endDate: '' }),
  });
  const paymentTypeLabels: Record<string, string> = {
    EFECTIVO: 'Efectivo', CHEQUE: 'Cheque', TRANSFERENCIA: 'Transferencia', DEPOSITO: 'Depósito',
  };
  if (filters.paymentTypes) activeFilters.push({
    key: 'paymentTypes', label: `Ingreso: ${filters.paymentTypes.split(',').map((type) => paymentTypeLabels[type] ?? type).join(', ')}`,
    onRemove: () => setFilters({ ...filters, paymentTypes: '' }),
  });
  if (filters.banco) activeFilters.push({
    key: 'bank', label: `Banco: ${filters.banco}`,
    onRemove: () => setFilters({ ...filters, banco: '', cuentaDestinoId: 0 }),
  });
  if (filters.cuentaDestinoId) activeFilters.push({
    key: 'account', label: `Cuenta: ${(() => {
      const account = bankAccountsCatalog.find((item) => item.id === filters.cuentaDestinoId);
      return account ? formatAccount(account.banco, account.numeroCuenta) : 'seleccionada';
    })()}`,
    onRemove: () => setFilters({ ...filters, cuentaDestinoId: 0 }),
  });
  if (filters.socioComercialId) activeFilters.push({
    key: 'partner', label: `Socio: ${commercialLevelOneUsers.find((socio) => socio.id === filters.socioComercialId)?.nombre ?? filters.socioComercialId}`,
    onRemove: () => setFilters({ ...filters, socioComercialId: 0 }),
  });
  if (filters.activo !== 'ACTIVE') activeFilters.push({
    key: 'active', label: filters.activo === 'ALL' ? 'Todas las operaciones' : 'Inactivas',
    onRemove: () => setFilters({ ...filters, activo: 'ACTIVE' }),
  });

  return (
    <div className="space-y-3">
      <PageHeader
        title="Operaciones"
        className="flex-row flex-wrap items-center justify-between gap-3 [&>div:last-child]:ml-auto"
        actions={canCreateOperation ? (
          <Button type="button" variant="primary" onClick={() => navigate(paths.operationCreate)}>
            Nueva operación
          </Button>
        ) : undefined}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {hasOperationsNeedingCommissionReview && (
            <div className="m-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Hay operaciones en este listado con 2 o 3 niveles de socios comerciales (marcadas con el folio en círculo). Revisa si conviene personalizar los porcentajes de comisión al editarlas.
              </p>
            </div>
          )}
        <SearchFilterBar
          search={filters.search}
          onSearchChange={(search) => setFilters({ ...filters, search })}
          searchPlaceholder="Buscar folio, cliente o socio comercial"
          activeFilters={showingStalled ? [] : activeFilters}
          onFiltersOpenChange={setFiltersOpen}
          leading={isManager ? <Tabs
            label="Vistas de operaciones"
            options={[{ value: 'stalled', label: 'Detenidas' }, { value: 'pending', label: 'Por validar' }, { value: 'all', label: 'Todas' }]}
            value={listView}
            onChange={(value) => {
              setListView(value);
              setStalledPage(0);
              setCurrentPage(0);
              if (value !== 'all') setFilters({ ...filters, status: 'ALL', search: '' });
            }}
          /> : undefined}
          filters={showingStalled ? (
            <p className="text-sm text-slate-600">La búsqueda revisa todas las operaciones detenidas antes de paginar.</p>
          ) : <OperationsFilters
            filters={filters}
            onChange={setFilters}
            showEstatusFilter={!isManager || listView === 'all'}
            showPaymentTypeFilter={showPaymentTypeFilter && !filters.workQueue}
            hideCashPaymentType={hideCashPaymentType}
            bankAccounts={bankAccountsCatalog}
            showSocioFilter={showSocioFilter}
            socios={commercialLevelOneUsers}
          />}
        />

        {visibleError && <p role="alert" className="p-4 text-sm text-rose-700">No se pudo cargar el listado. <button type="button" className="underline" onClick={() => void refreshVisibleOperations()}>Reintentar</button></p>}
        {!visibleError && <OperationsTable
          operations={visibleOperations}
          isLoading={visibleIsLoading}
          stalledView={showingStalled}
          emptyTitle={showingStalled && stalledSearch ? 'Sin coincidencias' : undefined}
          emptyDescription={showingStalled && stalledSearch ? 'Prueba otra búsqueda.' : undefined}
          currentPage={visiblePage}
          totalPages={visibleTotalPages}
          totalElements={visibleTotalElements}
          onPageChange={showingStalled ? setStalledPage : setCurrentPage}
          onViewDetail={(id, scrollToPayments = false) => {
            navigate(buildOperationDetailPath(id), {
              state: {
                scrollToPayments,
              },
            });
          }}
          onAddPayment={handleOpenAddPayment}
          onEditOperation={handleOpenEditOperation}
          onOperationUpdated={refreshVisibleOperations}
          onActivateOperation={async (id) => { await handleActivate(id); if (showingStalled) await stalledQuery.refetch(); }}
          onDeactivateOperation={async (id) => { await handleDeactivate(id); if (showingStalled) await stalledQuery.refetch(); }}
          onDeleteOperation={setOperationToDelete}
          togglingOperationId={processingOperationId}
        />}

        <div className="p-4">
          <Pagination
            currentPage={visiblePage + 1}
            totalPages={visibleTotalPages}
            totalElements={visibleTotalElements}
            isLoading={visibleIsLoading}
            onPageChange={(page) => showingStalled ? setStalledPage(page - 1) : setCurrentPage(page - 1)}
          />
        </div>
      </section>

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

      <ActionDrawer
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
      </ActionDrawer>

      <DeleteConfirmationModal
        open={Boolean(operationToDelete)}
        heading="Eliminar operación"
        title={`Estás a punto de eliminar definitivamente la operación #${operationToDelete?.id ?? ''}.`}
        warning={
          <>
            <p className="font-semibold">Esta eliminación es permanente</p>
            <p className="mt-1">
              Se borrarán también sus comprobantes pendientes, en proceso o
              rechazados y las notificaciones relacionadas. No se podrá deshacer.
            </p>
          </>
        }
        details={
          operationToDelete ? (
            <dl className="space-y-1">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Folio</dt>
                <dd className="font-medium">Operación #{operationToDelete.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Cliente</dt>
                <dd className="font-medium">{operationToDelete.clienteNombre}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Monto total</dt>
                <dd className="font-medium">
                  {formatMoney(operationToDelete.montoTotal)}
                </dd>
              </div>
            </dl>
          ) : null
        }
        isSubmitting={isDeleting}
        onClose={() => setOperationToDelete(null)}
        onConfirm={async () => {
          if (!operationToDelete) return;
          const ok = await submitDeleteOperation(operationToDelete);
          // Solo se cierra tras confirmar el borrado en el backend.
          if (ok) setOperationToDelete(null);
        }}
      />
    </div>
  );
}
