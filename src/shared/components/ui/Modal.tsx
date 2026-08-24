import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="system-modal-title" className="flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-white shadow-2xl shadow-black/30 sm:max-h-[92vh] sm:rounded-[1.75rem]">
        <div className="relative flex shrink-0 items-center justify-between gap-3 overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-4 py-3 text-white sm:px-7 sm:py-5">
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
          <div>
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300 sm:block">Sistema de operaciones</p>
            <h2 id="system-modal-title" className="text-base font-bold tracking-tight text-white sm:mt-1 sm:text-xl">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white sm:h-9 sm:w-9"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-content min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 p-4 sm:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
