import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Landmark } from 'lucide-react';
import { paths } from '@/routes/paths';
import { QueryState } from '@/shared/components/ui/QueryState';
import { formatDateTime, formatMoney } from '@/shared/format';
import { cashWorkApi, type WorkTotal } from '../api/cash-work.api';

function Card({ label, total, to, action, icon: Icon }: { label: string; total: WorkTotal; to: string; action: string; icon: typeof ArrowDown }) {
  return <article className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold text-slate-800">{label}</h2><Icon aria-hidden className="h-5 w-5 shrink-0 text-[#3b6ef5]" /></div>
    <p className="mt-4 text-3xl font-bold tabular-nums text-slate-950">{total.count}</p>
    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-700">{formatMoney(total.amount)}</p>
    <p className="mt-2 min-h-9 text-xs text-slate-500">{total.oldest ? `Más antiguo: ${formatDateTime(total.oldest)}` : 'Sin pendientes'}</p>
    <Link to={to} className="mt-4 inline-flex min-h-9 self-start items-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-[#3b6ef5] hover:bg-blue-100">{action}</Link>
  </article>;
}

export function CashPendingSummary() {
  const query = useQuery({ queryKey: ['cash-work', 'summary'], queryFn: cashWorkApi.summary });
  return <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando pendientes de Caja…">
    {query.data && <div className="grid gap-4 md:grid-cols-3">
      <Card label="Pagos de ingreso por validar" total={query.data.income} to={paths.cashIncome} action="Ir a Entradas" icon={ArrowDown} />
      <Card label="Retiros de cuentas por confirmar" total={query.data.withdrawals} to={`${paths.cashIncome}?tab=withdrawals`} action="Ir a Entradas" icon={Landmark} />
      <Card label="Retornos por entregar" total={query.data.outflow} to={paths.cashOutflow} action="Ir a Salidas" icon={ArrowUp} />
    </div>}
  </QueryState>;
}
