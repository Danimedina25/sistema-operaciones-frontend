import { useNavigate } from 'react-router-dom';
import { Banknote, Landmark, Clock, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { CollapsibleFilterSection } from '@/shared/components/ui/CollapsibleFilterSection';
import { PendingTaskCard } from '@/shared/components/dashboard/PendingTaskCard';
import { useTableCacheKey } from '@/shared/hooks/use-table-filters';
import { paths } from '@/routes/paths';
import { useWorkOperations } from '../hooks/use-work-operations';
import { usePendingDeliveries } from '../hooks/use-pending-deliveries';
import { emptyOperationFilters, staffCapabilities, type SupervisedRole, type WorkQueue } from '../utils/staff-work';
import type { SocioPendingSummaryParams } from '../hooks/use-socio-pending-summary';
import type { RoleName } from '@/modules/auth/types/auth.types';

const labels: Record<WorkQueue, string> = {
  CASH_INCOME: 'Operaciones con ingresos en efectivo por validar',
  BANK_INCOME: 'Operaciones con ingresos bancarios por validar',
  CASH_RETURNS: 'Operaciones con retornos por preparar',
  BANK_RETURNS: 'Operaciones con retornos bancarios por pagar',
};
function LoadError({ label, retry }: { label: string; retry: () => void }) {
  return <div role="alert" className="flex h-32 flex-col rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="font-medium">{label}</p><p className="mt-2">No se pudo consultar el total.</p><button type="button" className="mt-auto self-start underline" onClick={retry}>Reintentar</button></div>;
}
function WorkCard({ queue, dates, supervisedRole }: { queue: WorkQueue; dates: SocioPendingSummaryParams; supervisedRole?: SupervisedRole }) {
  const navigate = useNavigate();
  const returns = queue.endsWith('_RETURNS');
  const query = useWorkOperations({ ...emptyOperationFilters, ...dates, workQueue: queue, supervisedRole: supervisedRole ?? '' }, 0, returns);
  const open = () => {
    const params = new URLSearchParams({ ...dates, workQueue: queue, activo: 'ACTIVE', ...(supervisedRole ? { supervisedRole } : {}) });
    navigate(`${returns ? paths.returnsforpayment : paths.operations}?${params}`);
  };
  return <div className="min-w-0">
    {query.error ? <LoadError label={labels[queue]} retry={() => void query.refetch()} /> :
      <PendingTaskCard label={labels[queue]} icon={queue.startsWith('CASH') ? Banknote : Landmark}
        count={query.isFetching ? null : query.data?.totalElements ?? null} onClick={open} />}
  </div>;
}
function DeliveryCard({ queue, supervisedRole }: { queue: 'TODAY' | 'CONFIRMATION'; supervisedRole?: SupervisedRole }) {
  const navigate = useNavigate();
  const query = usePendingDeliveries(queue, 0, '', supervisedRole);
  const label = queue === 'TODAY' ? 'Entregas pendientes de hoy' : 'Entregas pendientes de tu confirmación';
  return <div className="min-w-0">{query.error ? <LoadError label={label} retry={() => void query.refetch()} /> :
    <PendingTaskCard label={label} icon={queue === 'TODAY' ? Clock : ClipboardCheck}
      count={query.isFetching ? null : query.data?.totalElements ?? null}
      onClick={() => navigate(`${paths.todayCashDeliveries}?${new URLSearchParams({ queue, tipoPago: '', ...(supervisedRole ? { supervisedRole } : {}) })}`)} />}
    <p className="mt-1 text-xs text-slate-500">{queue === 'TODAY' ? 'Parcialidades por fecha de recolección: hoy.' : 'Parcialidades confirmadas por el socio, de cualquier fecha, sin cierre de cajas.'}</p>
  </div>;
}
export function StaffPendingSummaryCards({ roles, supervisedRole, title = 'Pendientes de tu área', ...dates }: SocioPendingSummaryParams & { roles?: readonly RoleName[]; supervisedRole?: SupervisedRole; title?: string }) {
  const { user } = useAuth();
  const effectiveRoles = roles ?? user?.roles ?? [];
  const { cash, bank } = staffCapabilities(effectiveRoles);
  const storageKey = useTableCacheKey(supervisedRole ? 'team-pending-panel' : 'staff-pending-panel');
  if (!cash && !bank) return null;
  return <CollapsibleFilterSection key={storageKey} title={title} storageKey={storageKey}>
    <p className="mb-3 text-xs text-slate-500">Operaciones únicas. El período corresponde a la fecha de creación de la operación; jefa y auxiliares de cuentas comparten los mismos pendientes.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {cash && <WorkCard queue="CASH_INCOME" dates={dates} supervisedRole={supervisedRole} />}
      {bank && <WorkCard queue="BANK_INCOME" dates={dates} supervisedRole={supervisedRole} />}
      {cash && <WorkCard queue="CASH_RETURNS" dates={dates} supervisedRole={supervisedRole} />}
      {bank && <WorkCard queue="BANK_RETURNS" dates={dates} supervisedRole={supervisedRole} />}
    </div>
    {cash && <section aria-label="Entregas de cajas" className="mt-5 border-t border-slate-200 pt-4">
      <h2 className="mb-2 text-base font-semibold">Entregas de cajas</h2>
      <p className="mb-3 text-xs text-slate-500">Estas tareas no dependen del período de operaciones seleccionado arriba.</p>
      <div className="grid gap-3 sm:grid-cols-2"><DeliveryCard queue="TODAY" supervisedRole={supervisedRole} /><DeliveryCard queue="CONFIRMATION" supervisedRole={supervisedRole} /></div>
    </section>}
  </CollapsibleFilterSection>;
}
