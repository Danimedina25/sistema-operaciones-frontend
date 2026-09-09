import { useNavigate } from 'react-router-dom';
import { Banknote, Landmark, Clock, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { CollapsibleFilterSection } from '@/shared/components/ui/CollapsibleFilterSection';
import { PendingTaskCard } from '@/shared/components/dashboard/PendingTaskCard';
import { useTableCacheKey } from '@/shared/hooks/use-table-filters';
import { paths } from '@/routes/paths';
import { useWorkOperations } from '../hooks/use-work-operations';
import { usePendingDeliveries } from '../hooks/use-pending-deliveries';
import { emptyOperationFilters, staffCapabilities, type WorkQueue } from '../utils/staff-work';
import type { SocioPendingSummaryParams } from '../hooks/use-socio-pending-summary';

const labels: Record<WorkQueue, string> = {
  CASH_INCOME: 'Operaciones con ingresos en efectivo por validar',
  BANK_INCOME: 'Operaciones con ingresos bancarios por validar',
  CASH_RETURNS: 'Operaciones con retornos por preparar',
  BANK_RETURNS: 'Operaciones con retornos bancarios por pagar',
};
function LoadError({ retry }: { retry: () => void }) {
  return <div role="alert" className="mt-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">No se pudo consultar el total. <button type="button" className="underline" onClick={retry}>Reintentar</button></div>;
}
function WorkCard({ queue, dates }: { queue: WorkQueue; dates: SocioPendingSummaryParams }) {
  const navigate = useNavigate();
  const returns = queue.endsWith('_RETURNS');
  const query = useWorkOperations({ ...emptyOperationFilters, ...dates, workQueue: queue }, 0, returns);
  const open = () => {
    const params = new URLSearchParams({ ...dates, workQueue: queue, activo: 'ACTIVE' });
    navigate(`${returns ? paths.returnsforpayment : paths.operations}?${params}`);
  };
  return <div>
    {query.error ? <><p className="text-sm font-medium">{labels[queue]}</p><LoadError retry={() => void query.refetch()} /></> :
      <PendingTaskCard label={labels[queue]} icon={queue.startsWith('CASH') ? Banknote : Landmark}
        count={query.isFetching ? null : query.data?.totalElements ?? null} onClick={open} />}
  </div>;
}
function DeliveryCard({ queue }: { queue: 'TODAY' | 'CONFIRMATION' }) {
  const navigate = useNavigate();
  const query = usePendingDeliveries(queue);
  const label = queue === 'TODAY' ? 'Entregas pendientes de hoy' : 'Entregas pendientes de tu confirmación';
  return <div>{query.error ? <><p className="text-sm font-medium">{label}</p><LoadError retry={() => void query.refetch()} /></> :
    <PendingTaskCard label={label} icon={queue === 'TODAY' ? Clock : ClipboardCheck}
      count={query.isFetching ? null : query.data?.totalElements ?? null}
      onClick={() => navigate(`${paths.todayCashDeliveries}?queue=${queue}&tipoPago=`)} />}
    <p className="mt-1 text-xs text-slate-500">{queue === 'TODAY' ? 'Parcialidades por fecha de recolección: hoy.' : 'Parcialidades confirmadas por el socio, de cualquier fecha, sin cierre de cajas.'}</p>
  </div>;
}
export function StaffPendingSummaryCards(dates: SocioPendingSummaryParams) {
  const { user } = useAuth();
  const { cash, bank } = staffCapabilities(user?.roles ?? []);
  const storageKey = useTableCacheKey('staff-pending-panel');
  if (!cash && !bank) return null;
  return <CollapsibleFilterSection key={storageKey} title="Pendientes de tu área" storageKey={storageKey}>
    <p className="mb-3 text-xs text-slate-500">Operaciones únicas. El período corresponde a la fecha de creación de la operación; jefa y auxiliares de cuentas comparten los mismos pendientes.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {cash && <WorkCard queue="CASH_INCOME" dates={dates} />}
      {bank && <WorkCard queue="BANK_INCOME" dates={dates} />}
      {cash && <WorkCard queue="CASH_RETURNS" dates={dates} />}
      {bank && <WorkCard queue="BANK_RETURNS" dates={dates} />}
    </div>
    {cash && <section aria-label="Entregas de cajas" className="mt-5 border-t border-slate-200 pt-4">
      <h2 className="mb-2 text-base font-semibold">Entregas de cajas</h2>
      <p className="mb-3 text-xs text-slate-500">Estas tareas no dependen del período de operaciones seleccionado arriba.</p>
      <div className="grid gap-3 sm:grid-cols-2"><DeliveryCard queue="TODAY" /><DeliveryCard queue="CONFIRMATION" /></div>
    </section>}
  </CollapsibleFilterSection>;
}
