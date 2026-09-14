import { DENOMINATIONS, type CashCounts } from '../types/caja-general.types';
import { countCents, currency } from '../utils/cash-amounts';
export function DenominationFields({ value, onChange, disabled = false }: {
  value: CashCounts; onChange: (value: CashCounts) => void; disabled?: boolean;
}) {
  const total = countCents(value);
  return <fieldset disabled={disabled} className="rounded-xl border border-slate-200 p-4">
    <legend className="px-2 text-sm font-semibold text-slate-800">Desglose por denominación</legend>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {DENOMINATIONS.map(([key, cents]) => <label key={key} className="text-sm text-slate-600">
        {currency(cents / 100)} × cantidad
        <input aria-label={`Cantidad de ${currency(cents / 100)}`} type="number" min="0" max="2147483647" step="1" required
          value={Number.isNaN(value[key]) ? '' : value[key]}
          onChange={event => onChange({ ...value, [key]: event.target.value === '' ? NaN : Number(event.target.value) })}
          className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:ring-2 focus:ring-slate-200" />
        <span className="mt-1 block text-xs text-slate-500">= {Number.isFinite(value[key]) ? currency(value[key] * cents / 100) : '—'}</span>
      </label>)}
    </div>
    <p className="mt-4 text-right font-semibold text-slate-900" aria-live="polite">Total contado: {Number.isFinite(total) ? currency(total / 100) : 'Revisa las cantidades'}</p>
  </fieldset>;
}
