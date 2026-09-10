import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ListChecks, Landmark, Wallet } from 'lucide-react';
import { DashboardSection } from '@/shared/components/layout/DashboardSection';
import { PendingTaskCard } from '@/shared/components/dashboard/PendingTaskCard';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';
import { paths } from '@/routes/paths';
import { useWorkOperations } from '@/modules/operations/hooks/use-work-operations';
import { usePendingDeliveries } from '@/modules/operations/hooks/use-pending-deliveries';
import { emptyOperationFilters } from '@/modules/operations/utils/staff-work';
import type { PeriodRange } from '@/modules/gerente/utils/period-range';
import type { GerenteDashboardSummary } from '@/modules/gerente/hooks/use-gerente-dashboard-summary';

function total(values: Array<number | undefined>) { return values.every((value) => value !== undefined) ? values.reduce((sum, value) => sum + (value ?? 0), 0) : null; }
const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(value);

export function OperationalHealth({ period, summary, isLoading }: { period: PeriodRange; summary: GerenteDashboardSummary; isLoading: boolean }) {
  const navigate = useNavigate();
  const dates = { dateFilter: '' as const, startDate: period.startDate, endDate: period.endDate };
  const cashIncome = useWorkOperations({ ...emptyOperationFilters, ...dates, workQueue: 'CASH_INCOME', supervisedRole: 'JEFA_CAJAS' }, 0);
  const cashReturns = useWorkOperations({ ...emptyOperationFilters, ...dates, workQueue: 'CASH_RETURNS', supervisedRole: 'JEFA_CAJAS' }, 0, true);
  const bankIncome = useWorkOperations({ ...emptyOperationFilters, ...dates, workQueue: 'BANK_INCOME', supervisedRole: 'JEFA_CUENTAS' }, 0);
  const bankReturns = useWorkOperations({ ...emptyOperationFilters, ...dates, workQueue: 'BANK_RETURNS', supervisedRole: 'JEFA_CUENTAS' }, 0, true);
  const todayDeliveries = usePendingDeliveries('TODAY', 0, '', 'JEFA_CAJAS');
  const confirmations = usePendingDeliveries('CONFIRMATION', 0, '', 'JEFA_CAJAS');
  const cash = total([cashIncome.data?.totalElements, cashReturns.data?.totalElements, todayDeliveries.data?.totalElements, confirmations.data?.totalElements]);
  const accounts = total([bankIncome.data?.totalElements, bankReturns.data?.totalElements]);
  const all = cash === null || accounts === null ? null : cash + accounts;
  const queryError = [cashIncome, cashReturns, bankIncome, bankReturns, todayDeliveries, confirmations].find((query) => query.error);
  const params = new URLSearchParams({ supervisedRole: 'JEFA_CAJAS', dateFilter: '', startDate: period.startDate, endDate: period.endDate });

  return <>
    <DashboardSection title="Salud de la operación" description="Tareas actuales de Cajas y Cuentas. No incluye pendientes de socios comerciales."
      contentClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <PendingTaskCard label="Pendientes del equipo" count={queryError ? null : all} icon={ListChecks}
        onClick={() => navigate(`${paths.teamPending}?${params}`)} />
      <PendingTaskCard label="Ingresos por validar" count={total([cashIncome.data?.totalElements, bankIncome.data?.totalElements])} icon={Wallet}
        onClick={() => navigate(`${paths.teamPending}?${params}`)} />
      <PendingTaskCard label="Retornos por atender" count={isLoading ? null : summary.retornosPendientes} icon={Landmark}
        onClick={() => navigate(`${paths.returnsforpayment}?startDate=${period.startDate}&endDate=${period.endDate}`)} />
      <MetricCard className="h-32" label="Comisiones pendientes" value={isLoading ? '' : money(summary.comisionesPendientes ?? 0)} isLoading={isLoading}
        icon={AlertTriangle} variant="amber" onClick={() => navigate(paths.comisionessocios)} />
    </DashboardSection>
    <DashboardSection title="Carga por área" description="Cantidad de tareas, no operaciones únicas; una operación puede requerir acciones en más de una cola." contentClassName="block w-full">
      <div className="w-full overflow-x-auto"><table className="w-full min-w-[42rem] text-sm"><thead><tr className="bg-slate-100 text-left text-xs uppercase text-slate-500"><th className="px-4 py-3">Área</th><th className="px-4 py-3">Tareas pendientes</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Detalle</th></tr></thead><tbody>
        {[{ label: 'Cajas', count: cash, role: 'JEFA_CAJAS' }, { label: 'Cuentas', count: accounts, role: 'JEFA_CUENTAS' }].map((area) => <tr key={area.label} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{area.label}</td><td className="px-4 py-3 tabular-nums">{area.count ?? 'Cargando…'}</td><td className="px-4 py-3">{area.count === null ? 'Consultando' : area.count === 0 ? 'Sin pendientes' : 'Requiere atención'}</td><td className="px-4 py-3 text-right"><button className="font-medium text-blue-600 hover:underline" onClick={() => navigate(`${paths.teamPending}?supervisedRole=${area.role}&startDate=${period.startDate}&endDate=${period.endDate}&dateFilter=`)}>Supervisar</button></td></tr>)}
      </tbody></table></div>
      {queryError && <div role="alert" className="mt-3 flex items-center gap-3 text-xs text-rose-600"><span>No fue posible consultar una o más colas.</span><button className="font-semibold underline" onClick={() => void Promise.all([cashIncome.refetch(), cashReturns.refetch(), bankIncome.refetch(), bankReturns.refetch(), todayDeliveries.refetch(), confirmations.refetch()])}>Reintentar</button></div>}
    </DashboardSection>
  </>;
}
