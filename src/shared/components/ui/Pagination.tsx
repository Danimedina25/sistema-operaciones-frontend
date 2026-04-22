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
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
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
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>

        <span className="text-sm text-slate-600">
          {currentPage} / {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}