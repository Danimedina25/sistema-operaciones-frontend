import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type MetricCardVariant = 'default' | 'emerald' | 'amber' | 'rose' | 'blue';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  isLoading?: boolean;
  icon?: ComponentType<{ className?: string }>;
  onClick?: () => void;
  helperText?: string;
  variant?: MetricCardVariant;
  className?: string;
}

const VARIANT_STYLES: Record<MetricCardVariant, { container: string; label: string; value: string; icon: string }> = {
  default: {
    container: 'border-slate-200 bg-white',
    label: 'text-slate-500',
    value: 'text-slate-900',
    icon: 'text-slate-400',
  },
  emerald: {
    container: 'border-emerald-200 bg-emerald-50',
    label: 'text-emerald-700',
    value: 'text-emerald-900',
    icon: 'text-emerald-500',
  },
  amber: {
    container: 'border-amber-200 bg-amber-50',
    label: 'text-amber-700',
    value: 'text-amber-900',
    icon: 'text-amber-500',
  },
  rose: {
    container: 'border-rose-200 bg-rose-50',
    label: 'text-rose-700',
    value: 'text-rose-900',
    icon: 'text-rose-500',
  },
  blue: {
    container: 'border-blue-200 bg-blue-50',
    label: 'text-blue-700',
    value: 'text-blue-900',
    icon: 'text-blue-500',
  },
};

/**
 * Tarjeta de métrica reutilizable para dashboards. Soporta estado de carga
 * (skeleton), acción de clic para navegar con filtros aplicados, y
 * variantes de color consistentes con el resto del sistema.
 */
export function MetricCard({
  label,
  value,
  isLoading = false,
  icon: Icon,
  onClick,
  helperText,
  variant = 'default',
  className,
}: MetricCardProps) {
  const styles = VARIANT_STYLES[variant];
  const isInteractive = typeof onClick === 'function';

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className={cn('text-[11px] font-semibold uppercase tracking-[0.12em]', styles.label)}>
          {label}
        </p>
        {Icon ? <Icon className={cn('h-4 w-4 shrink-0', styles.icon)} /> : null}
      </div>

      <div className={cn('mt-2 text-2xl font-bold tabular-nums', styles.value)}>
        {isLoading ? (
          <span
            aria-label="Cargando"
            className="inline-block h-6 w-16 animate-pulse rounded bg-slate-200"
          />
        ) : (
          value
        )}
      </div>

      {helperText && !isLoading ? (
        <p className="mt-1 text-xs text-slate-400">{helperText}</p>
      ) : null}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full rounded-2xl border p-4 text-left shadow-sm transition-all duration-200',
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
          styles.container,
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn('w-full rounded-2xl border p-4 text-left shadow-sm', styles.container, className)}>
      {content}
    </div>
  );
}
