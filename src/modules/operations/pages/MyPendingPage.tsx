import { StaffPendingSummaryCards } from '../components/StaffPendingSummaryCards';
import { SocioPendingSummaryCards } from '../components/SocioPendingSummaryCards';
import type { SocioPendingSummaryParams } from '../hooks/use-socio-pending-summary';
import { useTableFilters } from '@/shared/hooks/use-table-filters';
import { PendingDateFilters } from '../components/PendingDateFilters';

const defaults: SocioPendingSummaryParams = {
  dateFilter: 'THIS_MONTH', startDate: '', endDate: '',
};
export default function MyPendingPage() {
  const { filters, setFilters } = useTableFilters('table-filters:my-pending', defaults);

  return (
    <div className="space-y-3">
      <header className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Mis pendientes</h1>
        <p className="text-sm text-slate-500">Consulta tus pendientes y accede a las operaciones que requieren tu atención.</p>
      </header>
      <PendingDateFilters label="Fechas de mis pendientes" filters={filters} onChange={setFilters} />
      <SocioPendingSummaryCards {...filters} />
      <StaffPendingSummaryCards {...filters} />
    </div>
  );
}
