import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUp, Clock3, Landmark, ShieldCheck, Truck } from 'lucide-react';
import { paths } from '@/routes/paths';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { QueryState } from '@/shared/components/ui/QueryState';
import { formatDateTime, formatMoney } from '@/shared/format';
import { cashWorkApi, type WorkTotal } from '../api/cash-work.api';

function Card({ label, total, to, action, icon: Icon, kind, unit }: { label: string; total: WorkTotal; to: string; action: string; icon: typeof ArrowDown; kind: 'income' | 'withdrawal' | 'outflow'; unit: string }) {
  const colors = kind === 'income' ? 'border-t-blue-500 bg-blue-100 text-blue-700' : kind === 'withdrawal' ? 'border-t-emerald-600 bg-emerald-100 text-emerald-700' : 'border-t-teal-600 bg-teal-100 text-teal-700';
  return <article className={`flex min-w-0 flex-col rounded-2xl border border-t-[3px] border-slate-200 bg-white p-6 shadow-sm ${colors.split(' ')[0]}`}>
    <div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.split(' ').slice(1).join(' ')}`}><Icon aria-hidden className="h-5 w-5" /></span><h2 className="min-w-0 flex-1 text-base font-semibold leading-5 text-slate-950">{label}</h2><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${kind === 'outflow' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{kind === 'outflow' ? <ArrowUp className="mr-1 inline h-3.5 w-3.5" /> : <ArrowDown className="mr-1 inline h-3.5 w-3.5" />}{kind === 'outflow' ? 'Salida' : 'Entrada'}</span></div>
    <p className="mt-5 flex items-baseline gap-2"><strong className="text-4xl font-bold tabular-nums text-slate-950">{total.count}</strong><span className="text-sm text-slate-500">{unit}</span></p>
    <p className="mt-2 text-lg font-semibold tabular-nums text-slate-950">{formatMoney(total.amount)}</p>
    <p className="mt-3 min-h-10 text-sm text-slate-500">{total.oldest ? <><Clock3 className="mr-1 inline h-4 w-4" /> Más antiguo: {formatDateTime(total.oldest)}</> : 'Sin pendientes'}</p>
    <Link to={to} className="mt-auto inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">{action} <ArrowRight className="h-4 w-4" /></Link>
  </article>;
}

export function CashPendingSummary() {
  const query = useQuery({ queryKey: ['cash-work', 'summary'], queryFn: cashWorkApi.summary });
  const count = query.data ? query.data.income.count + query.data.withdrawals.count + query.data.outflow.count : null;
  return <div className="space-y-5">
    <div><PageHeader title="Mis pendientes" /><p className="mt-0.5 text-sm text-slate-500">{count === null ? 'Cargando pendientes de Caja General…' : `${count} pendientes en Caja General`}</p></div>
    <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando pendientes de Caja…">
      {query.data && <div className="grid gap-5 md:grid-cols-3">
        <Card label="Ingresos de operaciones para validar" total={query.data.income} to={paths.cashIncome} action="Ir a Entradas › Pagos de ingreso" icon={ShieldCheck} kind="income" unit="pagos (efectivo y cheque)" />
        <Card label="Retiros de cuentas por ingresar" total={query.data.withdrawals} to={`${paths.cashIncome}?tab=withdrawals`} action="Ir a Entradas › Retiros de cuentas" icon={Landmark} kind="withdrawal" unit={query.data.withdrawals.count === 1 ? 'retiro' : 'retiros'} />
        <Card label="Retornos de operaciones para pagar (entregas de efectivo)" total={query.data.outflow} to={paths.cashOutflow} action="Ir a Salidas › Retornos" icon={Truck} kind="outflow" unit={query.data.outflow.count === 1 ? 'entrega' : 'entregas'} />
      </div>}
    </QueryState>
  </div>;
}
