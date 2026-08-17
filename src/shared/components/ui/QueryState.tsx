import type { ReactNode } from 'react';
import { EmptyState } from '@/shared/components/ui/EmptyState';

interface QueryStateProps {
  isLoading: boolean;
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  children: ReactNode;
}

/**
 * Wrapper reutilizable para los 4 estados obligatorios de una consulta:
 * carga, error, vacío y reintento. Evita reimplementar el mismo patrón en
 * cada tabla/listado.
 */
export function QueryState({
  isLoading,
  error,
  isEmpty = false,
  onRetry,
  loadingLabel = 'Cargando...',
  emptyTitle = 'Sin resultados',
  emptyDescription,
  errorTitle = 'No se pudo cargar la información.',
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
        {loadingLabel}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-sm font-semibold text-rose-800">{errorTitle}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children}</>;
}
