import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { useClientes } from '@/modules/clientes/hooks/use-clientes';
import { useCommercialPartners } from '@/modules/socioscomerciales/hooks/use-commercial-partners';
import { useCommercialLevelOneUsers } from '@/modules/users/hooks/use-commercial-level-one-users';
import { useConfiguracionGeneral } from '@/modules/configuraciones/hooks/use-configuracion-general';
import { useCreateOperation } from '../hooks/use-create-operation';
import { CreateOperationForm } from '../components/CreateOperationForm';
import { buildOperationDetailPath, paths } from '@/routes/paths';
import { PageHeader } from '@/shared/components/layout/PageHeader';

export default function NewOperationPage() {
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const canAssignLevelOne = hasRole(['ADMIN']);
  const { accounts, isLoading: loadingAccounts } = useBankAccounts();
  const { clientes, isLoading: loadingClients } = useClientes();
  const { commercialPartners, isLoading: loadingPartners } = useCommercialPartners();
  const { commercialLevelOneUsers, isLoading: loadingUsers } = useCommercialLevelOneUsers({ enabled: canAssignLevelOne });
  const { configuracionGeneral, isLoading: loadingConfig } = useConfiguracionGeneral({ enabled: canAssignLevelOne });
  const { isSubmitting, submitCreateOperation } = useCreateOperation({
    onSuccess: (id) => navigate(buildOperationDetailPath(id)),
  });

  const bankAccounts = useMemo(() => accounts.filter((account) => account.activo).map((account) => ({
    id: account.id,
    label: `${account.banco} - ${account.titular} - ${account.numeroCuenta}`,
  })), [accounts]);
  const clientOptions = useMemo(() => clientes.filter((client) => client.activo).map((client) => ({
    id: client.id,
    label: client.nombre,
    nivelesRedComercial: client.nivelesRedComercial,
  })), [clientes]);
  const partnerOptions = useMemo(() => commercialPartners.filter((partner) => partner.activo), [commercialPartners]);
  const loading = loadingAccounts || loadingClients || loadingPartners || (canAssignLevelOne && (loadingUsers || loadingConfig));

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 pb-8">
      <button type="button" onClick={() => navigate(paths.operations)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Operaciones
      </button>
      <PageHeader title="Nueva operación" />
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Cargando formulario...</div> : canAssignLevelOne && !configuracionGeneral ? (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">No se pudo cargar la configuración de comisiones. Vuelve a abrir esta pantalla.</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
          <CreateOperationForm
            isSubmitting={isSubmitting}
            bankAccounts={bankAccounts}
            clientes={clientOptions}
            commercialPartners={partnerOptions}
            porcentajeComisionOficinaDefault={configuracionGeneral?.porcentajeComisionOficina ?? 0}
            levelOneUsers={commercialLevelOneUsers.map((item) => ({ id: item.id, nombre: item.nombre, porcentajeComision: item.commercialSettings?.porcentajeComision ?? 0 }))}
            currentLevelOneId={canAssignLevelOne ? 0 : (user?.userId ?? 0)}
            currentLevelOneCommission={user?.porcentajeComision ?? 0}
            canAssignLevelOne={canAssignLevelOne}
            onSubmit={submitCreateOperation}
          />
        </div>
      )}
    </div>
  );
}
