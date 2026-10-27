// src/modules/socioscomerciales/pages/CommercialPartnersPage.tsx

import { useEffect, useMemo, useRef, useState } from 'react';

import { ActionDrawer, ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { Pagination } from '@/shared/components/ui/Pagination';
import { DeleteConfirmationModal } from '@/shared/components/ui/DeleteConfirmationModal';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/Button';

import { CommercialPartnersFilters } from '@/modules/socioscomerciales/components/CommercialPartnersFilters';
import { CommercialPartnersTable } from '@/modules/socioscomerciales/components/CommercialPartnersTable';
import { CreateCommercialPartnerForm } from '@/modules/socioscomerciales/components/CreateCommercialPartnerForm';

import { useCreateCommercialPartner } from '@/modules/socioscomerciales/hooks/use-create-commercial-partner';
import { useDeleteCommercialPartner } from '@/modules/socioscomerciales/hooks/use-delete-commercial-partner';

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
import { useTableFilters } from '@/shared/hooks/use-table-filters';
import { useAuth } from '@/modules/auth/store/auth.context';
import { SocioMobileNetworkTabs } from '@/shared/components/layout/SocioMobileNetworkTabs';
import { configureCommercialPartnerCommission } from '../api/socioscomerciales.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import toast from 'react-hot-toast';

const initialFilters: CommercialPartnersFiltersType = {
  search: '',
  status: 'ACTIVE',
};

export default function CommercialPartnersPage() {
  const { hasRole, user } = useAuth();
  const isSocio = hasRole('SOCIO_COMERCIAL');
  const canManage = hasRole(['ADMIN', 'GERENTE', 'SOCIO_COMERCIAL']);
  const canConfigureCommission = hasRole(['ADMIN', 'GERENTE']);
  const { filters, setFilters } = useTableFilters('table-filters:commercial-partners', initialFilters);

  const configurationSubmitting = useRef(false);
  const [configurationError, setConfigurationError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingPartner, setEditingPartner] =
    useState<CommercialPartnerResponse | null>(null);

  const [deletingPartner, setDeletingPartner] =
    useState<CommercialPartnerResponse | null>(null);
  const [configuringPartner, setConfiguringPartner] = useState<CommercialPartnerResponse | null>(null);
  const [configurationPercent, setConfigurationPercent] = useState('');
  const [configurationBusy, setConfigurationBusy] = useState(false);

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

  const { isDeleting, submitDeleteCommercialPartner } = useDeleteCommercialPartner({
    onSuccess: async () => {
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
    <div className="space-y-3 sm:space-y-6">
      <PageHeader title="Socios comerciales" className={isSocio ? 'max-sm:hidden' : undefined} actions={isSocio ? <Button type="button" variant="dark" onClick={() => setIsCreateModalOpen(true)}>＋ Nuevo socio comercial</Button> : undefined} />

      {!isSocio && <div className="space-y-3">
        <p className="text-sm text-slate-500">Los socios secundarios pueden ocupar el nivel 2 o 3 en cada operación y no entran al sistema.</p>
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">Los socios de nivel 1 tienen acceso al sistema y se administran en <a href="/usuarios" className="font-semibold text-blue-600 hover:underline">Administración › Usuarios →</a></p>
      </div>}

      {isSocio && <SocioMobileNetworkTabs />}

      <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${isSocio ? 'max-sm:overflow-visible max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none' : ''}`}>
        <CommercialPartnersFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Cargando socios comerciales...
        </div>
      ) : (
        <>
          <CommercialPartnersTable
            commercialPartners={paginatedPartners}
            processingPartnerId={processingPartnerId}
            canEdit={canManage}
            canChangeStatus={canManage}
            canDelete={hasRole('ADMIN')}
            canConfigureCommission={canConfigureCommission}
            editableOwnerId={isSocio ? user?.userId : undefined}
            onConfigureCommission={partner => { setConfigurationError(''); setConfiguringPartner(partner); setConfigurationPercent(partner.commissionConfigured === false ? '' : String(partner.porcentajeComision)); }}
            onEdit={setEditingPartner}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onDelete={setDeletingPartner}
          />

          <div className="p-4"><Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={filteredPartners.length}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
          /></div>
        </>
      )}
      </div>

      {isSocio && <Button type="button" variant="dark" className="fixed bottom-[76px] right-4 z-20 h-12 rounded-full px-5 shadow-xl sm:hidden" onClick={() => setIsCreateModalOpen(true)}>＋ Nuevo socio</Button>}

      <ActionDrawer
        open={isCreateModalOpen} busy={isCreating}
        title="Crear socio comercial"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <CreateCommercialPartnerForm
          isSubmitting={isCreating}
          onCancel={() => setIsCreateModalOpen(false)}
          onSubmit={submitCreateCommercialPartner}
        />
      </ActionDrawer>

      <ActionDrawer
        open={Boolean(editingPartner)} busy={isUpdating}
        title="Editar socio comercial"
        onClose={() => setEditingPartner(null)}
      >
        {editingPartner ? (
          <CommercialPartnerForm
            isSubmitting={isUpdating}
          onCancel={() => setEditingPartner(null)}
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
      </ActionDrawer>

      <ActionDrawer open={Boolean(configuringPartner)} busy={configurationBusy} title="Configurar comisión" onClose={() => setConfiguringPartner(null)}>
        {configuringPartner && <form id="partner-commission-settings" className="space-y-4" onSubmit={async event => {
          event.preventDefault();
          if (configurationSubmitting.current || configurationBusy) return;
          setConfigurationError('');
          const percent = Number(configurationPercent);
          if (!configurationPercent.trim() || !Number.isFinite(percent) || percent < 0 || percent > 100) return;
          configurationSubmitting.current = true;
          setConfigurationBusy(true);
          try {
            await configureCommercialPartnerCommission(configuringPartner.id, { porcentajeComision: percent });
            await fetchCommercialPartners();
            setConfiguringPartner(null);
            toast.success('Comisión configurada para operaciones nuevas');
          } catch (error) { setConfigurationError(getApiErrorMessage(error)); }
          finally { configurationSubmitting.current = false; setConfigurationBusy(false); }
        }}>
          {configurationError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{configurationError}</p>}
          <p className="text-sm text-slate-600"><strong>{configuringPartner.nombre}</strong> · Registrado por: {configuringPartner.socioComercialNombre}</p>
          <label className="block text-sm font-medium text-slate-700">Porcentaje de comisión
            <input disabled={configurationBusy} required type="number" min="0" max="100" step="0.01" value={configurationPercent} onChange={event => setConfigurationPercent(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
          <p className="text-xs text-slate-500">Aplica como valor inicial a operaciones nuevas. No modifica operaciones existentes.</p>
          <ActionDrawerFooter><div className="flex justify-end gap-3"><Button type="button" variant="neutral" disabled={configurationBusy} onClick={() => setConfiguringPartner(null)}>Cancelar</Button><Button form="partner-commission-settings" type="submit" variant="primary" isLoading={configurationBusy}>Guardar configuración</Button></div></ActionDrawerFooter>
        </form>}
      </ActionDrawer>

      <DeleteConfirmationModal
        open={Boolean(deletingPartner)}
        title={`Estás a punto de eliminar definitivamente al socio comercial "${deletingPartner?.nombre ?? ''}".`}
        isSubmitting={isDeleting}
        onClose={() => setDeletingPartner(null)}
        onConfirm={async () => {
          if (!deletingPartner) return;
          const ok = await submitDeleteCommercialPartner(deletingPartner.id);
          if (ok) setDeletingPartner(null);
        }}
      />
    </div>
  );
}
