import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/format';

interface ProgressBarProps {
  /** Monto total de la operación. */
  total: number;
  /** Monto registrado (incluye validado y pendiente por validar). */
  registered: number;
  /** Monto validado. Debe ser un subconjunto de `registered`. */
  validated: number;
  /** Usa 'dark' cuando la barra se muestra sobre un fondo oscuro. */
  variant?: 'light' | 'dark';
  className?: string;
  compact?: boolean;
}

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max((part / total) * 100, 0), 100);
}

/**
 * Barra de avance accesible que distingue monto registrado de monto
 * validado usando colores consistentes (ámbar = registrado, esmeralda =
 * validado) para no confundir ambos conceptos.
 */
export function ProgressBar({
  total,
  registered,
  validated,
  variant = 'light',
  className,
  compact = false,
}: ProgressBarProps) {
  const registeredPercent = toPercent(registered, total);
  const validatedPercent = toPercent(validated, total);
  const isDark = variant === 'dark';

  if (compact) {
    return (
      <div className={cn('flex min-w-0 items-center gap-2', className)}
        title={`Validado: ${formatMoney(validated)} · Registrado: ${formatMoney(registered)}`}>
        <div role="progressbar" aria-label="Avance de validación de la operación"
          aria-valuenow={Math.round(validatedPercent)} aria-valuemin={0} aria-valuemax={100}
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${validatedPercent}%` }} />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600">{Math.round(validatedPercent)}%</span>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(validatedPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance de validación de la operación"
        className={cn(
          'relative h-2.5 w-full overflow-hidden rounded-full',
          isDark ? 'bg-white/10' : 'bg-slate-200',
        )}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-amber-300 transition-all"
          style={{ width: `${registeredPercent}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${validatedPercent}%` }}
        />
      </div>

      <div
        className={cn(
          'mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium',
          isDark ? 'text-slate-300' : 'text-slate-500',
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Validado {Math.round(validatedPercent)}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          Registrado {Math.round(registeredPercent)}%
        </span>
      </div>
    </div>
  );
}
