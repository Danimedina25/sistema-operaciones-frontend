import { PageHeader } from '@/shared/components/layout/PageHeader';
import { StaffPendingSummaryCards } from '../components/StaffPendingSummaryCards';
import { SocioPendingAccordion } from '../components/SocioPendingAccordion';
import { useAuth } from '@/modules/auth/store/auth.context';
import { CashPendingSummary } from '@/modules/caja-general/components/CashPendingSummary';
import { BankPendingSummary } from '@/modules/corte/components/BankPendingSummary';

// Las tareas pendientes abarcan todas las fechas; el filtro anterior no se aplica aquí.
const allDates = { dateFilter: '' as const, startDate: '', endDate: '' };
export default function MyPendingPage() {
  const { hasRole } = useAuth();
  if (hasRole(['JEFA_CAJAS'])) return <div className="mx-4 pt-2"><CashPendingSummary /></div>;
  if (hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS'])) return <div className="mx-4 pt-2"><BankPendingSummary /></div>;
  return (
    <div className="space-y-5">
      <PageHeader title="Mis pendientes" className={hasRole('SOCIO_COMERCIAL') ? 'hidden sm:block' : undefined} />
      <SocioPendingAccordion />
      <StaffPendingSummaryCards {...allDates} />
    </div>
  );
}
