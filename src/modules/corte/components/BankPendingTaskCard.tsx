import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUp, Clock3, ShieldCheck, Send } from 'lucide-react';
import { formatDateTime, formatMoney } from '@/shared/format';
import type { BankWorkTotal } from '../api/bank-work.api';
import { PendingUrgencyBadge } from '@/shared/components/ui/PendingUrgencyBadge';
import { usePendingUrgency } from '@/shared/hooks/use-pending-urgency';

export function BankPendingTaskCard({ label, total, to, action, kind, unit, children }: { label: string; total: BankWorkTotal; to: string; action: string; kind: 'income' | 'outflow'; unit: string; children?: ReactNode }) {
  const Icon = kind === 'income' ? ShieldCheck : Send;
  const urgency = usePendingUrgency()(total.count, total.oldest);
  return <article className={`flex min-w-0 flex-col rounded-2xl border border-t-[3px] border-slate-200 bg-white p-6 shadow-sm ${kind === 'income' ? 'border-t-emerald-500' : 'border-t-red-500'}`}>
    <div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kind === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}><Icon aria-hidden className="h-5 w-5" /></span><h2 className="min-w-0 flex-1 text-base font-semibold leading-5 text-slate-950">{label}</h2><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${kind === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{kind === 'income' ? <ArrowDown className="mr-1 inline h-3.5 w-3.5" /> : <ArrowUp className="mr-1 inline h-3.5 w-3.5" />}{kind === 'income' ? 'Entrada' : 'Salida'}</span></div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2"><p className="flex items-baseline gap-2"><strong className="text-4xl font-bold tabular-nums text-slate-950">{total.count}</strong><span className="text-sm text-slate-500">{unit}</span></p><PendingUrgencyBadge urgency={urgency} /></div>
    <p className="mt-2 text-lg font-semibold tabular-nums text-slate-950">{formatMoney(total.amount)}</p>
    <p className="mt-3 min-h-10 text-sm text-slate-500">{total.oldest ? <><Clock3 className="mr-1 inline h-4 w-4" /> Más antiguo: {formatDateTime(total.oldest)}</> : 'Sin pendientes'}</p>
    {children}
    <Link to={to} className="mt-auto inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">{action} <ArrowRight className="h-4 w-4" /></Link>
  </article>;
}

