import { FileSpreadsheet, Download, X } from 'lucide-react';

interface NominaFileFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingFileUrl?: string | null;
  onRemoveExisting?: () => void;
  disabled?: boolean;
}

export function NominaFileField({
  value,
  onChange,
  existingFileUrl,
  onRemoveExisting,
  disabled = false,
}: NominaFileFieldProps) {
  const hasExisting = !value && !!existingFileUrl;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Archivo de nóminas <span className="font-normal text-slate-400">(opcional)</span>
      </label>

      <p className="mb-2 text-xs text-slate-500">
        Si el cliente entregó un Excel para pagar a sus empleados, adjúntalo aquí.
      </p>

      {value ? (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              Archivo seleccionado
            </p>
            <p className="mt-1 break-all text-xs text-slate-500">
              {value.name}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Cambiar
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={disabled}
                onChange={(event) => {
                  onChange(event.target.files?.[0] ?? null);
                  event.target.value = '';
                }}
              />
            </label>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Quitar archivo seleccionado"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : hasExisting ? (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-900">
              Archivo actual
            </p>
            <a
              href={existingFileUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </a>
          </div>

          <div className="flex shrink-0 gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
              Reemplazar
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={disabled}
                onChange={(event) => {
                  onChange(event.target.files?.[0] ?? null);
                  event.target.value = '';
                }}
              />
            </label>

            {onRemoveExisting ? (
              <button
                type="button"
                disabled={disabled}
                onClick={onRemoveExisting}
                className="inline-flex items-center rounded-lg border border-emerald-200 bg-white px-2 py-2 text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Quitar archivo actual"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <label
          className={`
            flex
            min-h-[96px]
            w-full
            cursor-pointer
            flex-col
            items-center
            justify-center
            rounded-xl
            border-2
            border-dashed
            border-slate-300
            bg-white
            px-4
            py-5
            text-center
            transition
            hover:border-slate-400
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={disabled}
            onChange={(event) => {
              onChange(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />

          <FileSpreadsheet className="h-6 w-6 text-slate-400" />

          <p className="mt-2 text-sm font-medium text-slate-700">
            Haz clic para adjuntar el archivo de nóminas
          </p>

          <p className="mt-1 text-xs text-slate-400">
            XLSX, XLS o CSV
          </p>
        </label>
      )}
    </div>
  );
}
