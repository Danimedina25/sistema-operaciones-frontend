import { useEffect, useMemo, useState } from 'react';
import { CanAccess } from '@/shared/components/CanAccess';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { useClientes } from '@/modules/clientes/hooks/use-clientes';
import { useCreateCliente } from '@/modules/clientes/hooks/use-create-cliente';
import { useUpdateCliente } from '@/modules/clientes/hooks/use-update-cliente';
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

const initialFilters: ClientesFiltersType = {
  search: '',
  status: 'ALL',
};

export default function ClientesPage() {
  const [filters, setFilters] = useState<ClientesFiltersType>(initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteResponse | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  const {
    clientes,
    isLoading,
    processingClienteId,
    fetchClientes,
    handleActivate,
    handleDeactivate,
  } = useClientes();

  const { isSubmitting: isCreating, submitCreateCliente } = useCreateCliente({
    onSuccess: async () => {
      setIsCreateModalOpen(false);
      await fetchClientes();
    },
  });

  const { isSubmitting: isUpdating, submitUpdateCliente } = useUpdateCliente({
    onSuccess: async () => {
      setEditingCliente(null);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Clientes primarios
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Administra clientes, niveles de red comercial y porcentajes de comisión.
          </p>
        </div>

        <CanAccess roles={['ADMIN', 'GERENTE']}>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Nuevo cliente
          </button>
        </CanAccess>
      </div>

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
            onEdit={setEditingCliente}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={filteredClientes.length}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <Modal
        open={isCreateModalOpen}
        title="Crear nuevo cliente"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <CreateClienteForm
          isSubmitting={isCreating}
          onSubmit={submitCreateCliente}
        />
      </Modal>

      <Modal
        open={Boolean(editingCliente)}
        title="Editar cliente"
        onClose={() => setEditingCliente(null)}
      >
        {editingCliente ? (
          <ClienteForm
            isSubmitting={isUpdating}
            initialValues={{
              nombre: editingCliente.nombre,
              activo: editingCliente.activo,
              nivelesRedComercial: editingCliente.nivelesRedComercial,
              porcentajeComisionAplicado:
                editingCliente.porcentajeComisionAplicado,
            }}
            onSubmit={(values) => submitUpdateCliente(editingCliente, values)}
            submitLabel="Guardar cambios"
          />
        ) : null}
      </Modal>
    </div>
  );
}