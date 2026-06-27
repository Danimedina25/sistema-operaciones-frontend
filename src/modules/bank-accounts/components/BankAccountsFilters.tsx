import type { BankAccountsFilters as BankAccountsFiltersType } from '@/modules/bank-accounts/utils/bank-accounts-filters';

interface BankAccountsFiltersProps {
  filters: BankAccountsFiltersType;
  onChange: (filters: BankAccountsFiltersType) => void;
}

export function BankAccountsFilters({
  filters,
  onChange,
}: BankAccountsFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Buscar
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(event) =>
              onChange({
                ...filters,
                search: event.target.value,
              })
            }
            placeholder="Banco, titular, cuenta o CLABE"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Estado
          </label>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as BankAccountsFiltersType['status'],
              })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activas</option>
            <option value="INACTIVE">Inactivas</option>
          </select>
        </div>
      </div>
    </div>
  );
}