import { useTableUrlFilters } from '@/shared/hooks/use-table-filters';
import { PendingDateFilters } from '../components/PendingDateFilters';
import { StaffPendingSummaryCards } from '../components/StaffPendingSummaryCards';
import type { SocioPendingSummaryParams } from '../hooks/use-socio-pending-summary';
import type { SupervisedRole } from '../utils/staff-work';

type TeamPendingFilters = SocioPendingSummaryParams & { supervisedRole: SupervisedRole };
const defaults: TeamPendingFilters = { supervisedRole: 'JEFA_CAJAS', dateFilter: 'THIS_MONTH', startDate: '', endDate: '' };
const options: Array<{ value: SupervisedRole; label: string }> = [
  { value: 'JEFA_CAJAS', label: 'Jefa de Cajas' },
  { value: 'JEFA_CUENTAS', label: 'Jefa de Cuentas' },
  { value: 'AUXILIAR_CUENTAS', label: 'Auxiliar de Cuentas' },
];

export default function TeamPendingPage() {
  const { filters, setFilters } = useTableUrlFilters(defaults);
  const dates = { dateFilter: filters.dateFilter, startDate: filters.startDate, endDate: filters.endDate };
  return <div className="space-y-3">
    <header className="rounded-2xl bg-white p-4 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Pendientes del equipo</h1>
      <p className="text-sm text-slate-500">Supervisa las tareas operativas pendientes de los equipos de cajas y cuentas.</p>
    </header>
    <section aria-label="Perfil supervisado" className="rounded-2xl bg-white p-4 shadow-sm">
      <label htmlFor="supervised-role" className="mb-1 block text-xs font-medium text-slate-600">Perfil</label>
      <select id="supervised-role" value={filters.supervisedRole}
        onChange={(event) => setFilters({ ...filters, supervisedRole: event.target.value as SupervisedRole })}
        className="h-11 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-900">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </section>
    <PendingDateFilters label="Fechas de pendientes del equipo" filters={dates}
      onChange={(next) => setFilters({ ...filters, ...next })} />
    <StaffPendingSummaryCards {...dates} roles={[filters.supervisedRole]} supervisedRole={filters.supervisedRole}
      title={`Pendientes de ${options.find((option) => option.value === filters.supervisedRole)?.label ?? 'perfil seleccionado'}`} />
  </div>;
}
