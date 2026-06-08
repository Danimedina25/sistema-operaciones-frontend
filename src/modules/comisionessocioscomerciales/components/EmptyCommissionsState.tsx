interface EmptyCommissionsStateProps {
  onResetFilters?: () => void;
}

export function EmptyCommissionsState({
  onResetFilters,
}: EmptyCommissionsStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-base font-semibold text-slate-900">
        No existen comisiones para el rango seleccionado
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Intenta modificar las fechas de búsqueda.
      </p>

      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
        >
          Cambiar filtros
        </button>
      )}
    </div>
  );
}