import { formatMoney } from '@/shared/format';
import type { MyWeeklyCommissionsResponse } from '../types/commercial-partner-commissions.types';

export function MyCommissionsSummaryCards({ summary }: { summary: MyWeeklyCommissionsResponse }) {
  const cards = [
    { label: 'Mi comisión', value: formatMoney(summary.totalGanado), featured: true },
    { label: 'Comisión de mi red', value: formatMoney(summary.totalGanadoRed) },
    { label: 'Operaciones', value: String(summary.totalOperaciones) },
  ];
  return <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950 p-4 md:grid-cols-3 md:gap-3 md:bg-transparent md:p-0">{cards.map((card) => <div key={card.label}
    className={`rounded-xl border p-3 shadow-sm md:p-5 ${card.featured ? 'col-span-2 border-slate-900 bg-slate-950 text-white max-md:border-0 max-md:px-0 max-md:pt-0 max-md:shadow-none md:col-span-1' : 'border-slate-700 bg-slate-800 text-white md:border-slate-200 md:bg-white md:text-slate-900'}`}>
    <p className={`text-[10px] font-semibold uppercase tracking-wider ${card.featured ? 'text-slate-400' : 'text-slate-400 md:text-slate-500'}`}>{card.label}</p>
    <p className={`mt-1 font-bold tabular-nums ${card.featured ? 'text-3xl md:text-2xl' : 'text-base md:text-2xl'}`}>{card.value}</p>
  </div>)}</div>;
}
