import { PageHeader } from '@/shared/components/layout/PageHeader';
import { StaffPendingSummaryCards } from '../components/StaffPendingSummaryCards';
import { SocioPendingAccordion } from '../components/SocioPendingAccordion';

// Las tareas pendientes abarcan todas las fechas; el filtro anterior no se aplica aquí.
const allDates = { dateFilter: '' as const, startDate: '', endDate: '' };
export default function MyPendingPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Mis pendientes" />
      <SocioPendingAccordion />
      <StaffPendingSummaryCards {...allDates} />
    </div>
  );
}
