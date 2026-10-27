/** Estilos comunes de ventanas de trabajo; la presentación cambia, la jerarquía no. */
export const overlayStyles = {
  backdrop: 'bg-slate-950/50',
  header: 'flex shrink-0 items-start gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5',
  title: 'break-words text-xl font-bold leading-tight text-slate-950',
  subtitle: 'mt-1 break-words text-sm leading-5 text-slate-500',
  close: 'inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  body: 'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6',
  footer: 'shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6',
} as const;
