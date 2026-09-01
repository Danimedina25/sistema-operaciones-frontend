import { useEffect, useMemo, useState } from 'react';

interface FileUploadFieldProps {
  value?: FileList;
  onChange: (files: FileList | undefined) => void;
  /** Texto del encabezado cuando ya hay archivo, p.ej. "Comprobante seleccionado". */
  selectedLabel?: string;
  /** Texto de la zona de arrastre, p.ej. "Arrastra y suelta el comprobante aquí". */
  dropHint?: string;
  accept?: string;
  /** id único para el input de "cambiar archivo" (deben ser distintos si hay varios en la misma pantalla). */
  inputId: string;
}

function isImageFile(file?: File | null) {
  if (!file) return false;
  return file.type.startsWith('image/');
}

function buildFileList(file: File): FileList {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  return dataTransfer.files;
}

/**
 * Selector de archivo con miniatura, enlace para abrir la imagen y opción de
 * reemplazarla antes de guardar. Mismo comportamiento que los comprobantes de
 * ingreso (AddOperationPaymentForm).
 */
export function FileUploadField({
  value,
  onChange,
  selectedLabel = 'Archivo seleccionado',
  dropHint = 'Arrastra y suelta el archivo aquí',
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
  inputId,
}: FileUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);

  const selectedFile =
    value instanceof FileList && value.length > 0 ? value[0] : null;
  const selectedIsImage = isImageFile(selectedFile);

  const previewUrl = useMemo(
    () =>
      selectedFile && selectedIsImage
        ? URL.createObjectURL(selectedFile)
        : null,
    [selectedFile, selectedIsImage],
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (selectedFile) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={selectedLabel}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="px-2 text-center text-xs text-slate-500">PDF</div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{selectedLabel}</p>
            <p className="mt-1 break-all text-xs text-slate-500">
              {selectedFile.name}
            </p>

            <div className="mt-3 flex flex-col gap-2 min-[360px]:flex-row">
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ver imagen
                </a>
              )}

              <label
                htmlFor={inputId}
                className="inline-flex cursor-pointer items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Cambiar archivo
              </label>

              <input
                id={inputId}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(event) => onChange(event.target.files ?? undefined)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files?.[0];
        if (!file) return;

        onChange(buildFileList(file));
      }}
      className={`flex min-h-[170px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
        isDragging
          ? 'border-slate-900 bg-slate-50'
          : 'border-slate-300 bg-white hover:border-slate-400'
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onChange(event.target.files ?? undefined)}
      />

      <p className="text-sm font-medium text-slate-700">{dropHint}</p>
      <p className="mt-1 text-xs text-slate-500">
        o haz clic para seleccionar un archivo
      </p>
      <p className="mt-2 text-xs text-slate-400">PDF, JPG, JPEG, PNG o WEBP</p>
    </label>
  );
}
