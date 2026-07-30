import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ValidationReceiptViewerModalProps {
  receiptUrl: string;
  canReplace: boolean;
  isSaving: boolean;
  onClose: () => void;
  onReplace: (file: File) => Promise<void> | void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function isImageUrl(url: string) {
  const path = url.split('?')[0].toLowerCase();
  return /\.(jpe?g|png|webp|gif)$/.test(path);
}

function isImageFile(file?: File | null) {
  if (!file) return false;
  return file.type.startsWith('image/');
}

export function ValidationReceiptViewerModal({
  receiptUrl,
  canReplace,
  isSaving,
  onClose,
  onReplace,
}: ValidationReceiptViewerModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const displayUrl = pendingFile ? pendingPreviewUrl : receiptUrl;
  const displayIsImage = pendingFile
    ? isImageFile(pendingFile)
    : isImageUrl(receiptUrl);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [displayUrl]);

  useEffect(() => {
    if (!pendingFile || !isImageFile(pendingFile)) {
      setPendingPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(pendingFile);
    setPendingPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [pendingFile]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function clampScale(value: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setScale((prev) => clampScale(prev - event.deltaY * 0.002));
  }

  function handleMouseDown(event: React.MouseEvent<HTMLImageElement>) {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    positionStartRef.current = position;
  }

  function handleMouseMove(event: React.MouseEvent<HTMLImageElement>) {
    if (!isDragging) return;
    setPosition({
      x: positionStartRef.current.x + (event.clientX - dragStartRef.current.x),
      y: positionStartRef.current.y + (event.clientY - dragStartRef.current.y),
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleDoubleClick() {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }

  function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPendingFile(file);
    setError('');
    event.target.value = '';
  }

  function handleCancelChange() {
    setPendingFile(null);
    setError('');
  }

  async function handleSave() {
    if (!pendingFile) return;

    try {
      await onReplace(pendingFile);
      setPendingFile(null);
    } catch {
      setError('No se pudo guardar el comprobante. Intenta de nuevo.');
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/95">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <p className="text-sm font-medium text-white/80">
          {pendingFile
            ? 'Vista previa del comprobante nuevo'
            : 'Comprobante de validación'}
        </p>

        <div className="flex items-center gap-2">
          {displayIsImage && (
            <>
              <button
                type="button"
                onClick={() => setScale((prev) => clampScale(prev - 0.5))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white transition hover:bg-white/10"
                aria-label="Alejar"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setScale((prev) => clampScale(prev + 0.5))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white transition hover:bg-white/10"
                aria-label="Acercar"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleDoubleClick}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white transition hover:bg-white/10"
                aria-label="Restablecer zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white transition hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden"
        onWheel={displayIsImage ? handleWheel : undefined}
      >
        {displayUrl ? (
          displayIsImage ? (
            <img
              src={displayUrl}
              alt="Comprobante de validación"
              draggable={false}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
              className="absolute left-1/2 top-1/2 max-h-none max-w-none select-none"
              style={{
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              onClick={() => {
                if (scale === 1) setScale(2);
              }}
            />
          ) : (
            <iframe
              src={displayUrl}
              title="Comprobante de validación"
              className="h-full w-full border-0"
            />
          )
        ) : null}
      </div>

      <div className="border-t border-white/10 px-4 py-4 sm:px-6">
        {error ? (
          <p className="mb-3 text-sm text-rose-400">{error}</p>
        ) : null}

        {canReplace ? (
          pendingFile ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-white/60">
                Archivo seleccionado: {pendingFile.name}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelChange}
                  disabled={isSaving}
                  className="inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar cambio
                </button>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white/90">
              Cambiar comprobante
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleSelectFile}
              />
            </label>
          )
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
