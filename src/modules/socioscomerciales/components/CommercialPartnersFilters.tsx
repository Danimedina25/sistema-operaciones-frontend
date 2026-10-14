import { SearchFilterBar } from '@/shared/components/ui/SearchFilterBar';
import type { CommercialPartnersFilters as Values } from '../utils/commercial-partners-filters';
import { X } from 'lucide-react';

interface Props { filters: Values; onChange: (next: Values) => void }

export function CommercialPartnersFilters({ filters, onChange }: Props) {
  const statusLabel = filters.status === 'ACTIVE' ? 'Activos' : filters.status === 'INACTIVE' ? 'Inactivos' : 'Todos';
  return <SearchFilterBar search={filters.search} onSearchChange={(search) => onChange({ ...filters, search })} iconOnlyOnMobile
    searchPlaceholder="Buscar socio o cuenta" leading={filters.status !== 'ALL' ? <button type="button" aria-label={`Quitar filtro ${statusLabel}`} onClick={() => onChange({ ...filters, status: 'ALL' })} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 max-sm:order-3">{statusLabel}<X className="h-3 w-3" /></button> : null}
    filters={<label className="block max-w-xs text-xs font-semibold text-slate-700">Estado
      <select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as Values['status'] })}
        className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm">
        <option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option><option value="ALL">Todos</option>
      </select>
    </label>} />;
}
