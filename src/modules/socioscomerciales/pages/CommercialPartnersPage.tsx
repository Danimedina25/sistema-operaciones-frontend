// src/modules/socioscomerciales/pages/CommercialPartnersPage.tsx

import { useEffect, useMemo, useState } from 'react';

import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';

import { CommercialPartnersFilters } from '@/modules/socioscomerciales/components/CommercialPartnersFilters';
import { CommercialPartnersTable } from '@/modules/socioscomerciales/components/CommercialPartnersTable';
import { CreateCommercialPartnerForm } from '@/modules/socioscomerciales/components/CreateCommercialPartnerForm';

import { useCreateCommercialPartner } from '@/modules/socioscomerciales/hooks/use-create-commercial-partner';

import type { CommercialPartnerResponse } from '@/modules/socioscomerciales/types/socioscomerciales.types';

import {
  filterCommercialPartners,
  type CommercialPartnersFilters as CommercialPartnersFiltersType,
} from '@/modules/socioscomerciales/utils/commercial-partners-filters';

import {
  getTotalPages,
  paginateItems,
} from '@/shared/utils/pagination';
import { useCommercialPartners } from '../hooks/use-commercial-partners';
import { CommercialPartnerForm } from '../components/CommercialPartnerForm';
import { useUpdateCommercialPartner } from '../hooks/use-update-commercial-partner';

const initialFilters: CommercialPartnersFiltersType = {
  search: '',
  status: 'ALL',
};

export default function CommercialPartnersPage() {
  const [filters, setFilters] =
    useState<CommercialPartnersFiltersType>(initialFilters);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingPartner, setEditingPartner] =
    useState<CommercialPartnerResponse | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  const {
    commercialPartners,
    isLoading,
    processingPartnerId,
    fetchCommercialPartners,
    handleActivate,
    handleDeactivate,
  } = useCommercialPartners();

  const {
    isSubmitting: isCreating,
    submitCreateCommercialPartner,
  } = useCreateCommercialPartner({
    onSuccess: async () => {
      setIsCreateModalOpen(false);
      await fetchCommercialPartners();
    },
  });

  const {
    isSubmitting: isUpdating,
    submitUpdateCommercialPartner,
  } = useUpdateCommercialPartner({
    onSuccess: async () => {
      setEditingPartner(null);
      await fetchCommercialPartners();
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredPartners = useMemo(() => {
    return filterCommercialPartners(commercialPartners, filters);
  }, [commercialPartners, filters]);

  const totalPages = useMemo(() => {
    return getTotalPages(filteredPartners.length, pageSize);
  }, [filteredPartners.length, pageSize]);

  const paginatedPartners = useMemo(() => {
    return paginateItems(filteredPartners, currentPage, pageSize);
  }, [filteredPartners, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Socios comerciales
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Administra socios comerciales y sus cuentas bancarias.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Nuevo socio comercial
        </button>
      </div>

      <CommercialPartnersFilters
        filters={filters}
        onChange={setFilters}
      />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Cargando socios comerciales...
        </div>
      ) : (
        <>
          <CommercialPartnersTable
            commercialPartners={paginatedPartners}
            processingPartnerId={processingPartnerId}
            onEdit={setEditingPartner}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={filteredPartners.length}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <Modal
        open={isCreateModalOpen}
        title="Crear socio comercial"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <CreateCommercialPartnerForm
          isSubmitting={isCreating}
          onSubmit={submitCreateCommercialPartner}
        />
      </Modal>

      <Modal
        open={Boolean(editingPartner)}
        title="Editar socio comercial"
        onClose={() => setEditingPartner(null)}
      >
        {editingPartner ? (
          <CommercialPartnerForm
            isSubmitting={isUpdating}
            submitLabel="Guardar cambios"
            initialValues={{
              nombre: editingPartner.nombre,
              cuentaBancaria: editingPartner.cuentaBancaria,
              banco: editingPartner.banco,
              titularCuenta: editingPartner.titularCuenta,
              activo: editingPartner.activo,
            }}
            onSubmit={(values) =>
              submitUpdateCommercialPartner(
                editingPartner.id,
                values,
              )
            }
          />
        ) : null}
      </Modal>
    </div>
  );
}