import { useState } from 'react';
import { MexicanDenominationIcon } from './MexicanDenominationIcon';
import { DENOMINATIONS, type CashCounts, type Denomination } from '../types/caja-general.types';
import { countCents, currency } from '../utils/cash-amounts';
export function DenominationFields({ value, onChange, disabled = false }: {
  value: CashCounts; onChange: (value: CashCounts) => void; disabled?: boolean;
}) {
  const [emptyField, setEmptyField] = useState<Denomination | null>(null);
  const total = countCents(value);
  return <fieldset disabled={disabled} className="pt-1">
    <legend className="mb-2 text-sm font-semibold text-slate-800">Desglose por denominación</legend>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {DENOMINATIONS.map(([key, cents]) => <label key={key} className="rounded-lg border border-transparent bg-slate-50 p-2.5 text-sm text-slate-600 transition focus-within:border-slate-300 focus-within:bg-white">
        <span className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <MexicanDenominationIcon denomination={key} />
          <span className="font-semibold text-slate-800">{currency(cents / 100)}</span>
        </span>
        <span className="text-xs font-medium">Cantidad</span>
        <input aria-label={`Cantidad de ${currency(cents / 100)}`} type="number" min="0" max="2147483647" step="1" inputMode="numeric"
          value={Number.isNaN(value[key]) || (emptyField === key && value[key] === 0) ? '' : value[key]}
          onFocus={() => { if (value[key] === 0) setEmptyField(key); }}
          onBlur={() => setEmptyField(null)}
          onChange={event => {
            const blank = event.target.value === '';
            setEmptyField(blank ? key : null);
            // Vacío equivale a cero para el cálculo; no convierte una entrada inválida en cero.
            onChange({ ...value, [key]: event.target.validity.badInput ? NaN : Number(event.target.value) });
          }}
          className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-center tabular-nums outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
        <span className="mt-1 block text-xs text-slate-500">= {Number.isFinite(value[key]) ? currency(value[key] * cents / 100) : '—'}</span>
      </label>)}
    </div>
    <div className="mt-4 flex items-baseline justify-end gap-3 border-t border-slate-200 pt-3" aria-live="polite"><span className="text-sm text-slate-500">Total capturado</span><strong className="text-xl font-semibold tabular-nums text-slate-950">{Number.isFinite(total) ? currency(total / 100) : 'Revisa las cantidades'}</strong></div>
  </fieldset>;
}
