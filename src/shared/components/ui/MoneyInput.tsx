import { formatCurrencyDisplay, normalizeCurrencyInput, parseCurrency } from '@/shared/utils/form.utils';
import { cn } from '@/shared/lib/cn';

/**
 * Monto en pesos: muestra "$", separa miles con comas mientras se escribe y admite hasta dos
 * decimales. Al salir del campo completa los centavos ("1,500" → "1,500.00"). El valor que
 * recibe y entrega es el texto formateado; para enviarlo usa `moneyInputToNumber`.
 */
export function MoneyInput({ value, onChange, ariaLabel, placeholder = '0.00', className, disabled }: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn('relative', className)}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-slate-500">$</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={event => {
          const raw = event.target.value;
          onChange(/[\d]/.test(raw) || raw.includes('.') ? normalizeCurrencyInput(raw) : '');
        }}
        onBlur={() => {
          if (value.trim()) onChange(formatCurrencyDisplay(parseCurrency(value)));
        }}
        className="flex h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-7 pr-3.5 text-sm tabular-nums text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
      />
    </div>
  );
}
