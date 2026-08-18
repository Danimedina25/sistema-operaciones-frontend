import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BadgeDollarSign, Clock, HandCoins, PackageCheck } from 'lucide-react';
import { DashboardSection } from '@/shared/components/layout/DashboardSection';
import { PendingTaskCard } from '@/shared/components/dashboard/PendingTaskCard';
import {
  useSocioPendingSummary,
  type SocioPendingSummaryParams,
} from '@/modules/operations/hooks/use-socio-pending-summary';
import { dateFilterLabels } from '@/modules/operations/constants/operations.constants';
import { paths } from '@/routes/paths';

/**
 * Primer bloque del dashboard de SOCIO_COMERCIAL: contadores reales de
 * pendientes, clicables hacia el listado correspondiente con los filtros
 * ya aplicados en la URL. Vive en OperationsPage (donde el socio ya
 * aterriza hoy) mientras no exista una página de dashboard real por rol.
 * Respeta el mismo filtro de fecha que la tabla principal de operaciones.
 */
export function SocioPendingSummaryCards({
  dateFilter,
  startDate,
  endDate,
}: SocioPendingSummaryParams) {
  const navigate = useNavigate();
  const { summary, isLoading, enabled } = useSocioPendingSummary({
    dateFilter,
    startDate,
    endDate,
  });

  if (!enabled) return null;

  const activeFilterLabel = dateFilter ? dateFilterLabels[dateFilter] : null;

  return (
    <DashboardSection
      title="Mis pendientes"
      description={`Accesos directos a lo que necesita tu atención${activeFilterLabel ? ` (${activeFilterLabel})` : ''}.`}
      contentClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <PendingTaskCard
        label="Comprobantes rechazados"
        count={isLoading ? null : summary.rejectedPayments}
        icon={AlertTriangle}
        urgent
        onClick={() => navigate(`${paths.operations}?paymentStatus=RECHAZADA`)}
      />
      <PendingTaskCard
        label="Saldo pendiente por registrar"
        count={isLoading ? null : summary.pendingToRegister}
        icon={Clock}
        onClick={() => navigate(`${paths.operations}?status=PENDIENTE_VALIDACION`)}
      />
      <PendingTaskCard
        label="Listas para solicitar retorno"
        count={isLoading ? null : summary.readyToRequestReturn}
        icon={HandCoins}
        onClick={() => navigate(`${paths.operations}?status=VALIDADA`)}
      />
      <PendingTaskCard
        label="Retornos pendientes de confirmar"
        count={isLoading ? null : summary.returnsPendingConfirmation}
        icon={PackageCheck}
        onClick={() => navigate(`${paths.returnsRequested}?returnStatuses=ENTREGADO`)}
      />
      <PendingTaskCard
        label={`Comisiones pendientes (${activeFilterLabel ?? 'esta semana'})`}
        count={isLoading ? null : summary.pendingCommissions}
        icon={BadgeDollarSign}
        onClick={() => navigate(paths.miscomisiones)}
      />
    </DashboardSection>
  );
}
