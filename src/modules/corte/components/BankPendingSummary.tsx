import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { paths } from '@/routes/paths';
import { QueryState } from '@/shared/components/ui/QueryState';
import { formatDateTime, formatMoney } from '@/shared/format';
import { bankWorkApi, type BankWorkTotal } from '../api/bank-work.api';

function Card({ label, total, to, action, kind }: { label: string; total: BankWorkTotal; to: string; action: string; kind: 'income' | 'outflow' }) {
  const Icon = kind === 'income' ? ArrowDown : ArrowUp;
  return <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`-mx-5 -mt-5 mb-4 h-1 rounded-t-2xl ${kind === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
    <div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold text-slate-900">{label}</h2><Icon aria-hidden className={`h-5 w-5 shrink-0 ${kind === 'income' ? 'text-emerald-600' : 'text-red-600'}`} /></div>
    <p className="mt-4 text-3xl font-bold tabular-nums text-slate-950">{total.count}</p>
    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-700">{formatMoney(total.amount)}</p>
    <p className="mt-2 min-h-9 text-xs text-slate-500">{total.oldest ? `Más antiguo: ${formatDateTime(total.oldest)}` : 'Sin pendientes'}</p>
    <Link to={to} className="mt-4 inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">{action} →</Link>
  </article>;
}

export function BankPendingSummary() {
  const query = useQuery({ queryKey: ['bank-work', 'summary'], queryFn: bankWorkApi.summary });
  return <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando pendientes de Cuentas…">
    {query.data && <div className="grid gap-4 md:grid-cols-2">
      <Card label="Ingresos de operaciones para validar" total={query.data.income} to={paths.bankIncome} action="Ir a Entradas › Pagos de ingreso" kind="income" />
      <Card label="Retornos de operaciones para pagar" total={query.data.outflow} to={paths.bankOutflow} action="Ir a Salidas › Retornos" kind="outflow" />
    </div>}
  </QueryState>;
}
