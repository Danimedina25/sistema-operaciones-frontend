import { useState } from 'react';
import { DENOMINATIONS, type CashCounts, type Denomination } from '../types/caja-general.types';
import { countCents, currency } from '../utils/cash-amounts';

type Props = { value: CashCounts; onChange: (value: CashCounts) => void; disabled?: boolean };

export function CompactDenominationTables({ value, onChange, disabled = false }: Props) {
  const [emptyField, setEmptyField] = useState<Denomination | null>(null);
  const groups = [
    { title: 'Billetes', rows: DENOMINATIONS.slice(0, 6) },
    { title: 'Monedas', rows: DENOMINATIONS.slice(6) },
  ];

  return <div className="grid gap-4 min-[1360px]:grid-cols-2">
    {groups.map(({ title, rows }) => {
      const groupCounts = Object.fromEntries(DENOMINATIONS.map(([key]) => [key, rows.some(([rowKey]) => rowKey === key) ? value[key] : 0])) as CashCounts;
      const total = countCents(groupCounts);
      return <div key={title} className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full table-fixed text-sm">
          <colgroup><col className="w-[30%]" /><col className="w-[29%]" /><col className="w-[41%]" /></colgroup>
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[.08em] text-slate-400">
            <tr><th scope="col" className="px-4 py-3 text-left text-slate-600">{title}</th><th scope="col" className="py-3 text-center">Cantidad</th><th scope="col" className="px-4 py-3 text-right">Subtotal</th></tr>
          </thead>
          <tbody>
            {rows.map(([key, cents]) => {
              const quantity = value[key];
              const zero = quantity === 0;
              const denomination = key === 'D050' ? '50¢' : currency(cents / 100).replace(/\.00$/, '');
              return <tr key={key} className="border-t border-slate-100">
                <th scope="row" className={`px-4 py-2 text-left font-semibold ${zero ? 'text-slate-400' : 'text-slate-950'}`}>{denomination}</th>
                <td className="py-2 text-center"><input
                  aria-label={`Cantidad de ${currency(cents / 100)}`} type="number" min="0" max="2147483647" step="1" inputMode="numeric"
                  disabled={disabled} value={Number.isNaN(quantity) || (emptyField === key && zero) ? '' : quantity}
                  onFocus={() => { if (zero) setEmptyField(key); }} onBlur={() => setEmptyField(null)}
                  onChange={event => {
                    setEmptyField(event.target.value === '' ? key : null);
                    onChange({ ...value, [key]: event.target.validity.badInput ? NaN : Number(event.target.value) });
                  }}
                  className="h-9 w-[84px] max-w-full rounded-lg border border-slate-300 bg-white px-2 text-center font-semibold tabular-nums text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:bg-slate-50 disabled:text-slate-500" /></td>
                <td className={`px-4 py-2 text-right tabular-nums ${zero ? 'text-slate-400' : 'text-slate-700'}`}>{Number.isFinite(quantity) ? currency(quantity * cents / 100) : '—'}</td>
              </tr>;
            })}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50"><tr><th scope="row" colSpan={2} className="px-4 py-3 text-left font-medium text-slate-600">Total en {title.toLowerCase()}</th><td className="px-4 py-3 text-right font-bold tabular-nums text-slate-950">{Number.isFinite(total) ? currency(total / 100) : '—'}</td></tr></tfoot>
        </table>
      </div>;
    })}
  </div>;
}
