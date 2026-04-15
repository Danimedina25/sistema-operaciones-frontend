import type { RoleName } from '@/modules/auth/types/auth.types';
import { roleLabels } from '@/shared/utils/role-labels';
import type { UsersFilters as UsersFiltersType } from '@/modules/users/utils/users-filters';
import { Input } from '@/shared/components/ui/Input';

interface UsersFiltersProps {
  filters: UsersFiltersType;
  onChange: (next: UsersFiltersType) => void;
}

export function UsersFilters({ filters, onChange }: UsersFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Buscar
        </label>
        <Input
          placeholder="Buscar por nombre o correo"
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
          Rol
        </label>
        <select
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          value={filters.role}
          onChange={(e) =>
            onChange({
              ...filters,
              role: e.target.value as RoleName | 'ALL',
            })
          }
        >
          <option value="ALL">Todos</option>
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
              status: e.target.value as UsersFiltersType['status'],
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