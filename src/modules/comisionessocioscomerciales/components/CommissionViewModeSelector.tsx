interface CommissionViewModeSelectorProps {
  value:
    | 'OPERATIONS'
    | 'BENEFICIARIES';

  onChange: (
    value:
      | 'OPERATIONS'
      | 'BENEFICIARIES',
  ) => void;
}

export function CommissionViewModeSelector({
  value,
  onChange,
}: CommissionViewModeSelectorProps) {

  return (
    <div className="flex justify-center">
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">

        <button
          type="button"
          onClick={() =>
            onChange(
              'BENEFICIARIES',
            )
          }
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            value ===
            'BENEFICIARIES'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Por socios comerciales
        </button>

          <button
          type="button"
          onClick={() =>
            onChange(
              'OPERATIONS',
            )
          }
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            value ===
            'OPERATIONS'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Por operación
        </button>

      </div>
    </div>
  );
}