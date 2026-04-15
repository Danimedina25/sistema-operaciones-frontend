import { operationStatusLabels } from '@/modules/operations/constants/operations.constants';
import type { OperationsFilters as OperationsFiltersType } from '@/modules/operations/utils/operations-filters';
import { Input } from '@/shared/components/ui/Input';
import { OperationStatus } from '../types/operations.types.ts';

interface OperationsFiltersProps {
  filters: OperationsFiltersType;
  onChange: (next: OperationsFiltersType) => void;
}

const operationStatuses = Object.keys(operationStatusLabels) as OperationStatus[];

export function OperationsFilters({
  filters,
  onChange,
}: OperationsFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Buscar
        </label>
        <Input
          placeholder="Cliente, teléfono, banco o socio comercial"
          value={filters.search}
          onChange={(e) =>
            onChange({
              ...filters,
              search: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Estatus
        </label>
        <select
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as OperationStatus | 'ALL',
            })
          }
        >
          <option value="ALL">Todos</option>
          {operationStatuses.map((status) => (
            <option key={status} value={status}>
              {operationStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}