import { useAuth } from '@/modules/auth/store/auth.context';
import { QuickFilters } from '@/shared/components/dashboard/QuickFilters';
import { allowedWorkQueues, workQueueLabels, type WorkQueue } from '../utils/staff-work';
import type { OperationsFilters } from '../types/operations.types.ts';

export function WorkQueueFilters({ filters, onChange, returns = false }: {
  filters: OperationsFilters; onChange: (filters: OperationsFilters) => void; returns?: boolean;
}) {
  const { user } = useAuth();
  const queues = allowedWorkQueues(user?.roles ?? [], returns);
  if (!queues.length) return null;
  return <fieldset className="rounded-xl border border-slate-200 bg-white p-3">
    <legend className="px-1 text-sm font-medium">{returns ? 'Retornos pendientes de tu área' : 'Ingresos por validar'}</legend>
    <QuickFilters<WorkQueue>
      options={queues.map((value) => ({ value, label: workQueueLabels[value] }))}
      value={filters.workQueue ?? ''}
      onChange={(value) => onChange({ ...filters, workQueue: filters.workQueue === value ? '' : value, paymentStatus: '', paymentTypes: '', status: 'ALL' })}
    />
    {filters.workQueue && <p className="mt-2 text-xs text-slate-500">Pulsa nuevamente para quitar esta selección. Se mantienen los permisos de tu perfil.</p>}
  </fieldset>;
}
