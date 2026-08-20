interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  if (totalPages <= 1 && totalElements === 0) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row">
      <div className="text-sm text-slate-500">
        {totalElements > 0
          ? `Mostrando página ${currentPage} de ${totalPages} · ${totalElements} registros en total`
          : 'Sin registros'}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>

        <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold tabular-nums text-white">
          {currentPage} / {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
