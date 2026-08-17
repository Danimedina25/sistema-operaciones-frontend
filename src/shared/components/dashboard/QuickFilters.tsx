import { cn } from '@/shared/lib/cn';

interface QuickFilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface QuickFiltersProps<T extends string> {
  options: Array<QuickFilterOption<T>>;
  /**
   * Valor activo. Se tipa como `string` (no `T`) a propósito: el valor
   * actual del filtro puede no coincidir con ninguna opción rápida (por
   * ejemplo, un estatus fuera de los buckets predefinidos) — en ese caso
   * simplemente ningún botón aparece activo, sin ser un error de tipos.
   */
  value: string;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Grupo de chips controlado, sin lógica de negocio propia — recibe las
 * opciones y el valor activo, y delega el cambio al llamador (que
 * normalmente lo sincroniza con la URL vía `useUrlFilters`).
 */
export function QuickFilters<T extends string>({
  options,
  value,
  onChange,
  className,
}: QuickFiltersProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" aria-label="Filtros rápidos">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              isActive
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-500',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
