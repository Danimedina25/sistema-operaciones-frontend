import { useEffect, useMemo, useState } from 'react';
import { CanAccess } from '@/shared/components/CanAccess';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { Pagination } from '@/shared/components/ui/Pagination';
import { DeleteConfirmationModal } from '@/shared/components/ui/DeleteConfirmationModal';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { useClientes } from '@/modules/clientes/hooks/use-clientes';
import { useCreateCliente } from '@/modules/clientes/hooks/use-create-cliente';
import { useUpdateCliente } from '@/modules/clientes/hooks/use-update-cliente';
import { useDeleteCliente } from '@/modules/clientes/hooks/use-delete-cliente';
import type { ClienteResponse } from '@/modules/clientes/types/clientes.types';
import {
  filterClientes,
  type ClientesFilters as ClientesFiltersType,
} from '@/modules/clientes/utils/clientes-filters';
import { getTotalPages, paginateItems } from '@/shared/utils/pagination';
import { ClienteForm } from '../components/ClienteForm';
import { ClientesFilters } from '../components/ClientesFilters';
import { ClientesTable } from '../components/ClientesTable';
import { CreateClienteForm } from '../components/CreateClienteForm';
import { useAuth } from '@/modules/auth/store/auth.context';
import { useCommercialLevelOneUsers } from '@/modules/users/hooks/use-commercial-level-one-users';
import { useTableFilters } from '@/shared/hooks/use-table-filters';
import { SocioMobileNetworkTabs } from '@/shared/components/layout/SocioMobileNetworkTabs';

const initialFilters: ClientesFiltersType = {
  search: '',
  status: 'ACTIVE',
};

export default function ClientesPage() {
  const { filters, setFilters } = useTableFilters('table-filters:clients', initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteResponse | null>(
    null,
  );
  const [deletingCliente, setDeletingCliente] = useState<ClienteResponse | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6;

  const {
    clientes,
    isLoading,
    processingClienteId,
    fetchClientes,
    fetchMyClientes,
    handleActivate,
    handleDeactivate,
  } = useClientes();

  const { user, hasRole } = useAuth();
  const isSocio = hasRole('SOCIO_COMERCIAL');
  const canAssignLevelOne = hasRole(['ADMIN', 'GERENTE']);
  const canManage = hasRole(['ADMIN', 'GERENTE', 'SOCIO_COMERCIAL']);
  const { commercialLevelOneUsers } = useCommercialLevelOneUsers({ enabled: canAssignLevelOne });

  const { isSubmitting: isCreating, submitCreateCliente } = useCreateCliente({
    onSuccess: async () => {
      setIsCreateModalOpen(false);
       if(user?.roles.includes('SOCIO_COMERCIAL'))
        void fetchMyClientes();
      else
        await fetchClientes();
    },
  });

  const { isSubmitting: isUpdating, submitUpdateCliente } = useUpdateCliente({
    onSuccess: async () => {
      setEditingCliente(null);
      if(user?.roles.includes('SOCIO_COMERCIAL'))
        void fetchMyClientes();
      else
        await fetchClientes();
    },
  });

  const { isDeleting, submitDeleteCliente } = useDeleteCliente({
    onSuccess: async () => {
      if(user?.roles.includes('SOCIO_COMERCIAL'))
        void fetchMyClientes();
      else
        await fetchClientes();
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredClientes = useMemo(() => {
    return filterClientes(clientes, filters);
  }, [clientes, filters]);

  const totalPages = useMemo(() => {
    return getTotalPages(filteredClientes.length, pageSize);
  }, [filteredClientes.length, pageSize]);

  const paginatedClientes = useMemo(() => {
    return paginateItems(filteredClientes, currentPage, pageSize);
  }, [filteredClientes, currentPage, pageSize]);

  return (
    <div className="space-y-3 sm:space-y-6">
      <PageHeader title="Clientes" className={isSocio ? 'max-sm:hidden' : undefined} actions={<CanAccess roles={['ADMIN', 'GERENTE', 'SOCIO_COMERCIAL']}>
        <Button type="button" variant="dark" onClick={() => setIsCreateModalOpen(true)}>＋ Nuevo cliente</Button>
      </CanAccess>} />

      {isSocio && <SocioMobileNetworkTabs />}

      <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${isSocio ? 'max-sm:overflow-visible max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none' : ''}`}>
        <ClientesFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Cargando clientes...
        </div>
      ) : (
        <>
          <ClientesTable
            clientes={paginatedClientes}
            processingClienteId={processingClienteId}
            canEdit={canManage}
            canChangeStatus={canManage}
            canDelete={hasRole('ADMIN')}
            onEdit={setEditingCliente}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onDelete={setDeletingCliente}
          />

          <div className="p-4"><Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={filteredClientes.length}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
          /></div>
        </>
      )}
      </div>

      {isSocio && <CanAccess roles={['SOCIO_COMERCIAL']}><Button type="button" variant="dark" className="fixed bottom-[76px] right-4 z-20 h-12 rounded-full px-5 shadow-xl sm:hidden" onClick={() => setIsCreateModalOpen(true)}>＋ Nuevo cliente</Button></CanAccess>}

      <ActionDrawer
        open={isCreateModalOpen} busy={isCreating}
        title="Crear nuevo cliente"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <CreateClienteForm
          isSubmitting={isCreating}
          onCancel={() => setIsCreateModalOpen(false)}
          levelOneUsers={commercialLevelOneUsers}
          currentUserId={canAssignLevelOne ? 0 : (user?.userId ?? 0)}
          canAssignLevelOne={canAssignLevelOne}
          onSubmit={submitCreateCliente}
        />
      </ActionDrawer>

      <ActionDrawer
        open={Boolean(editingCliente)} busy={isUpdating}
        title="Editar cliente"
        onClose={() => setEditingCliente(null)}
      >
        {editingCliente ? (
          <ClienteForm
            isSubmitting={isUpdating}
          onCancel={() => setEditingCliente(null)}
            initialValues={{
              nombre: editingCliente.nombre,
              activo: editingCliente.activo,
            }}
            onSubmit={(values) => submitUpdateCliente(editingCliente, values)}
            submitLabel="Guardar cambios"
          />
        ) : null}
      </ActionDrawer>

      <DeleteConfirmationModal
        open={Boolean(deletingCliente)}
        title={`Estás a punto de eliminar definitivamente al cliente "${deletingCliente?.nombre ?? ''}".`}
        isSubmitting={isDeleting}
        onClose={() => setDeletingCliente(null)}
        onConfirm={async () => {
          if (!deletingCliente) return;
          const ok = await submitDeleteCliente(deletingCliente.id);
          if (ok) setDeletingCliente(null);
        }}
      />
    </div>
  );
}
