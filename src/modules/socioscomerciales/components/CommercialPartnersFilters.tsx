import { Input } from '@/shared/components/ui/Input';

import type {
  CommercialPartnersFilters as CommercialPartnersFiltersType,
} from '@/modules/socioscomerciales/utils/commercial-partners-filters';

interface CommercialPartnersFiltersProps {
  filters: CommercialPartnersFiltersType;
  onChange: (
    next: CommercialPartnersFiltersType,
  ) => void;
}

export function CommercialPartnersFilters({
  filters,
  onChange,
}: CommercialPartnersFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Buscar
        </label>

        <Input
          placeholder="Buscar por nombre o cuenta"
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
          Estado
        </label>

        <select
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status:
                e.target
                  .value as CommercialPartnersFiltersType['status'],
            })
          }
        >
          <option value="ALL">Todos</option>
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
        </select>
      </div>
    </div>
  );
}