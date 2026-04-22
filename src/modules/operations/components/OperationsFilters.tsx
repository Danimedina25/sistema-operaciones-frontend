import { operationStatusLabels } from '@/modules/operations/constants/operations.constants';
import { Input } from '@/shared/components/ui/Input';
import {
  OperationDateFilter,
  OperationStatus,
  OperationsFilters as OperationsFiltersType,
} from '../types/operations.types.ts';

interface OperationsFiltersProps {
  filters: OperationsFiltersType;
  onChange: (next: OperationsFiltersType) => void;
}

const operationStatuses = Object.keys(operationStatusLabels) as OperationStatus[];

const quickFilters: Array<{ value: OperationDateFilter; label: string }> = [
  { value: 'TODAY', label: 'Hoy' },
  { value: 'THIS_WEEK', label: 'Esta semana' },
  { value: 'THIS_MONTH', label: 'Este mes' },
  { value: 'LAST_MONTH', label: 'Mes pasado' },
];

export function OperationsFilters({
  filters,
  onChange,
}: OperationsFiltersProps) {
  function handleQuickFilterChange(value: OperationDateFilter) {
    onChange({
      ...filters,
      dateFilter: filters.dateFilter === value ? '' : value,
      startDate: '',
      endDate: '',
    });
  }

  function handleStartDateChange(value: string) {
    let nextEndDate = filters.endDate;

    if (value && nextEndDate && value > nextEndDate) {
      nextEndDate = value;
    }

    onChange({
      ...filters,
      startDate: value,
      endDate: nextEndDate,
      dateFilter: '',
    });
  }

  function handleEndDateChange(value: string) {
    let nextStartDate = filters.startDate;

    if (value && nextStartDate && value < nextStartDate) {
      nextStartDate = value;
    }

    onChange({
      ...filters,
      startDate: nextStartDate,
      endDate: value,
      dateFilter: '',
    });
  }

  function handleClearFilters() {
    onChange({
      search: '',
      status: 'ALL',
      dateFilter: '',
      startDate: '',
      endDate: '',
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Buscar
          </label>
          <Input
            placeholder="Cliente o Socio comercial"
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

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Filtros rápidos de fecha
        </label>

        <div className="flex flex-wrap gap-2">
          {quickFilters.map((item) => {
            const isActive = filters.dateFilter === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleQuickFilterChange(item.value)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Fecha inicio
          </label>
          <input
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Fecha fin
          </label>
          <input
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleClearFilters}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
}