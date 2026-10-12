import { useId, useState, type ReactNode } from 'react';
import { ListFilter, Search, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: ReactNode;
  activeFilters?: readonly ActiveFilter[];
  leading?: ReactNode;
  className?: string;
  onFiltersOpenChange?: (open: boolean) => void;
}

export function SearchFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar',
  filters,
  activeFilters = [],
  leading,
  className,
  onFiltersOpenChange,
}: SearchFilterBarProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={cn('border-b border-slate-100 bg-white', className)}>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        {leading}
        <label className="flex min-h-10 min-w-[12rem] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => {
            onFiltersOpenChange?.(!current);
            return !current;
          })}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          <ListFilter aria-hidden="true" className="h-4 w-4" />
          Filtros
          {activeFilters.length > 0 && <span className="rounded-full bg-blue-100 px-1.5 text-[10px] text-blue-700">{activeFilters.length}</span>}
        </button>
      </div>
      {activeFilters.length > 0 && (
        <div aria-label="Filtros activos" className="flex flex-wrap gap-2 px-4 pb-3">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={filter.onRemove}
              aria-label={`Quitar filtro ${filter.label}`}
              className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 text-xs font-medium text-blue-800 hover:bg-blue-100"
            >
              {filter.label}
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}
      {open && <div id={panelId} className="border-t border-slate-100 p-4">{filters}</div>}
    </div>
  );
}
