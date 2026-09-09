import { useTableFilters } from '@/shared/hooks/use-table-filters';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeDollarSign,
  ChevronDown,
  Clock,
  HandCoins,
  PackageCheck,
} from 'lucide-react';
import { DashboardSection } from '@/shared/components/layout/DashboardSection';
import { PendingTaskCard } from '@/shared/components/dashboard/PendingTaskCard';
import {
  useSocioPendingSummary,
  type SocioPendingSummaryParams,
} from '@/modules/operations/hooks/use-socio-pending-summary';
import { dateFilterLabels } from '@/modules/operations/constants/operations.constants';
import { resolveDateFilterRange } from '@/shared/utils/date-filter-range';
import { paths } from '@/routes/paths';

/** Contadores y accesos directos de la página independiente Mis pendientes. */
export function SocioPendingSummaryCards({
  dateFilter,
  startDate,
  endDate,
}: SocioPendingSummaryParams) {
  const navigate = useNavigate();
  const { filters: panelState, setFilters: setPanelState } = useTableFilters(
    'dashboard:socio-pending-panel',
    { isExpanded: false },
  );
  const { isExpanded } = panelState;
  const { summary, isLoading, enabled } = useSocioPendingSummary({
    dateFilter,
    startDate,
    endDate,
  });

  if (!enabled) return null;

  function openOperations(path: string, criteria: Record<string, string>) {
    const params = new URLSearchParams({ dateFilter, startDate, endDate, activo: 'ACTIVE', ...criteria });
    navigate(`${path}?${params}`);
  }

  function openCommissions() {
    const params = new URLSearchParams({
      ...resolveDateFilterRange(dateFilter, startDate, endDate),
      commissionStatus: 'GENERADA',
    });
    navigate(`${paths.miscomisiones}?${params}`);
  }

  const activeFilterLabel = dateFilter
    ? dateFilterLabels[dateFilter]
    : startDate && endDate ? `${startDate} al ${endDate}` : null;

  return (
    <DashboardSection
      title="Mis pendientes"
      description={`Accesos directos a lo que necesita tu atención${activeFilterLabel ? ` (${activeFilterLabel})` : ''}.`}
      contentClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
      action={
        <button
          type="button"
          onClick={() => setPanelState((current) => ({ isExpanded: !current.isExpanded }))}
          aria-expanded={isExpanded}
          aria-controls="socio-pending-summary-content"
          className="flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {isExpanded ? 'Ocultar' : 'Mostrar'}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      }
    >
      {isExpanded ? (
        <div id="socio-pending-summary-content" className="contents">
          <PendingTaskCard
            label="Comprobantes rechazados"
            count={isLoading ? null : summary.rejectedPayments}
            icon={AlertTriangle}
            urgent
            onClick={() => openOperations(paths.operations, { paymentStatus: 'RECHAZADA' })}
          />
          <PendingTaskCard
            label="Saldo pendiente por registrar"
            count={isLoading ? null : summary.pendingToRegister}
            icon={Clock}
            onClick={() => openOperations(paths.operations, { status: 'PENDIENTE_VALIDACION' })}
          />
          <PendingTaskCard
            label="Ingresos parciales por completar"
            count={isLoading ? null : summary.partialIncomeToRegister}
            icon={Clock}
            onClick={() => openOperations(paths.operations, { status: 'INGRESO_PARCIAL' })}
          />
          <PendingTaskCard
            label="Listas para solicitar retorno"
            count={isLoading ? null : summary.readyToRequestReturn}
            icon={HandCoins}
            onClick={() => openOperations(paths.operations, { status: 'VALIDADA' })}
          />
          <PendingTaskCard
            label="Retornos pendientes de confirmar"
            count={isLoading ? null : summary.returnsPendingConfirmation}
            icon={PackageCheck}
            onClick={() => openOperations(paths.returnsRequested, { returnStatuses: 'EN_RECOLECCION' })}
          />
          <PendingTaskCard
            label={`Comisiones pendientes (${activeFilterLabel ?? 'esta semana'})`}
            count={isLoading ? null : summary.pendingCommissions}
            icon={BadgeDollarSign}
            onClick={openCommissions}
          />
        </div>
      ) : null}
    </DashboardSection>
  );
}
