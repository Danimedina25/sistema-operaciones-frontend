import { formatMoney } from '@/shared/format';
import type { MyWeeklyCommissionsResponse } from '../types/commercial-partner-commissions.types';

export function MyCommissionsSummaryCards({ summary }: { summary: MyWeeklyCommissionsResponse }) {
  const cards = [
    { label: 'Mi comisión', value: formatMoney(summary.totalGanado), featured: true },
    { label: 'Comisión de mi red', value: formatMoney(summary.totalGanadoRed) },
    { label: 'Operaciones', value: String(summary.totalOperaciones) },
  ];
  return <div className="grid gap-3 md:grid-cols-3">{cards.map((card) => <div key={card.label}
    className={`rounded-xl border p-5 shadow-sm ${card.featured ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
    <p className={`text-[10px] font-semibold uppercase tracking-wider ${card.featured ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</p>
    <p className="mt-1 text-2xl font-bold tabular-nums">{card.value}</p>
  </div>)}</div>;
}
