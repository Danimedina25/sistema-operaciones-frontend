import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import closeIcon from '@/shared/assets/panel-close.svg';

interface ActionDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  ariaLabel?: string;
  footer?: ReactNode;
  className?: string;
}

const FooterContext = createContext<HTMLElement | null>(null);

/** Muestra las acciones del formulario en el pie fijo del panel. */
export function ActionDrawerFooter({ children }: { children: ReactNode }) {
  const target = useContext(FooterContext);
  return target ? createPortal(children, target) : children;
}

/** Panel de trabajo compartido: encabezado y acciones fijos, contenido desplazable. */
export function ActionDrawer({
  open, title, onClose, children, eyebrow, subtitle, ariaLabel, footer, className = '',
}: ActionDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeHandler = useRef(onClose);
  const [footerNode, setFooterNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    closeHandler.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeHandler.current();
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter(element => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button type="button" aria-label="Cerrar panel" tabIndex={-1}
        className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
      <FooterContext.Provider value={footerNode}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={ariaLabel ? undefined : titleId} aria-label={ariaLabel}
        className={`relative flex h-dvh w-full max-w-[560px] min-w-0 flex-col bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.2)] ${className}`}>
        <header className="flex shrink-0 items-start gap-3 border-b border-[#eef1f5] pb-5 pl-7 pr-6 pt-6">
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[1.32px] text-[#3b6ef5]">{eyebrow}</p>}
            <h2 id={titleId} className="break-words text-[22px] font-bold leading-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 break-words text-[13px] text-slate-500">{subtitle}</p>}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar"
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#3b6ef5]">
            <img src={closeIcon} alt="" />
          </button>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-7 py-5">{children}</div>
        <footer ref={setFooterNode} className="shrink-0 border-t border-[#eef1f5] bg-white px-7 py-4 empty:hidden">{footer}</footer>
      </section>
      </FooterContext.Provider>
    </div>, document.body,
  );
}
