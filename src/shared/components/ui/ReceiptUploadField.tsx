import { ReceiptViewerLink } from '@/shared/components/ui/ReceiptViewerLink';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import uploadIcon from '@/shared/assets/panel-upload.svg';

interface ReceiptUploadFieldProps {
  file: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  accept?: string;
  maxBytes?: number;
  disabled?: boolean;
  camera?: boolean;
  inputId?: string;
  dropHint?: string;
  selectedLabel?: string;
}

const DEFAULT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';

function accepts(file: File, accept: string): boolean {
  const name = file.name.toLowerCase();
  return accept.split(',').some(part => {
    const rule = part.trim().toLowerCase();
    return rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*')
      ? file.type.toLowerCase().startsWith(rule.slice(0, -1)) : file.type.toLowerCase() === rule;
  });
}

/** Archivo de comprobante con vista previa y toma de foto en dispositivos móviles. */
export function ReceiptUploadField({
  file, onChange, label = 'Comprobante', accept = DEFAULT_ACCEPT, maxBytes,
  disabled = false, camera = true, inputId, dropHint = 'Subir comprobante', selectedLabel,
}: ReceiptUploadFieldProps) {
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const previewUrl = useMemo(() => file && typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(file) : null, [file]);

  useEffect(() => {
    if (previewUrl) return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function select(next: File | null) {
    if (!next) return;
    if (!accepts(next, accept)) {
      setError('Selecciona un archivo del tipo permitido.');
      return;
    }
    if (maxBytes && next.size > maxBytes) {
      setError(`El archivo no debe superar ${Math.round(maxBytes / 1_048_576)} MB.`);
      return;
    }
    setError('');
    onChange(next);
  }

  const isImage = file?.type.startsWith('image/') ?? false;
  return <div className="relative min-w-0 space-y-2">
    {label && <span className="block text-[13px] font-medium text-slate-700">{label}</span>}
    {file ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      {previewUrl && isImage && <img src={previewUrl} alt={`Vista previa de ${file.name}`}
        className="mb-3 h-56 w-full rounded-lg object-contain" />}
      {previewUrl && !isImage && file.type === 'application/pdf' &&
        <iframe src={previewUrl} title={`Vista previa de ${file.name}`} className="mb-3 h-52 w-full rounded-lg border border-slate-200 bg-white" />}
      {selectedLabel && <p className="text-xs font-semibold text-slate-700">{selectedLabel}</p>}
      <p className="truncate text-sm font-semibold text-slate-800" title={file.name}>{file.name}</p>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        {previewUrl && <ReceiptViewerLink href={previewUrl} mimeType={file.type} className="font-medium text-[#3b6ef5]">Abrir comprobante</ReceiptViewerLink>}
        <button type="button" disabled={disabled} onClick={() => fileInput.current?.click()} className="font-medium text-[#3b6ef5]">Cambiar archivo</button>
        <button type="button" disabled={disabled} onClick={() => { setError(''); onChange(null); }}
          className="font-medium text-slate-600">Quitar</button>
      </div>
    </div> : <div onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled) select(event.dataTransfer.files?.[0] ?? null); }}
      className={`rounded-xl border border-dashed px-3 py-4 text-center ${dragging ? 'border-[#3b6ef5] bg-blue-50' : 'border-slate-300 bg-white'}`}>
      <button type="button" disabled={disabled} onClick={() => fileInput.current?.click()} className="flex w-full items-center justify-center gap-2 text-[13px] font-semibold text-[#3b6ef5]">
        <img src={uploadIcon} alt="" /> {dropHint}
      </button>
      <p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG o WEBP</p>
    </div>}
    <input ref={fileInput} id={id} type="file" accept={accept} aria-label={label || dropHint} disabled={disabled} hidden
      onChange={event => { select(event.target.files?.[0] ?? null); event.target.value = ''; }} />
    {camera && <>
      <button type="button" disabled={disabled} onClick={() => cameraInput.current?.click()} className="inline-flex items-center text-xs font-medium text-[#3b6ef5]">Tomar foto</button>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" disabled={disabled} hidden
        onChange={event => { select(event.target.files?.[0] ?? null); event.target.value = ''; }} />
    </>}
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
  </div>;
}
