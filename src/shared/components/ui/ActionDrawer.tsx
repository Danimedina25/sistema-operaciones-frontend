import { OverlayParentContext, useOverlay } from '@/shared/hooks/use-overlay';
import { createContext, useContext, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { overlayStyles } from './overlay-styles';

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
  busy?: boolean;
}

const FooterContext = createContext<HTMLElement | null>(null);

/** Muestra las acciones del formulario en el pie fijo del panel. */
export function ActionDrawerFooter({ children }: { children: ReactNode }) {
  const target = useContext(FooterContext);
  return target ? createPortal(children, target) : children;
}

/** Panel de trabajo compartido: encabezado y acciones fijos, contenido desplazable. */
export function ActionDrawer({
  open, title, onClose, children, eyebrow, subtitle, ariaLabel, footer, className = '', busy = false,
}: ActionDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = () => { if (!busy) onClose(); };
  const { overlayId, zIndex } = useOverlay(open, rootRef, close);
  const subtitleId = useId();
  const [footerNode, setFooterNode] = useState<HTMLElement | null>(null);

  if (!open) return null;
  return createPortal(
    <OverlayParentContext.Provider value={overlayId}><div ref={rootRef} tabIndex={-1} data-overlay-root style={{ zIndex }} className="fixed inset-0 flex justify-end">
      <button type="button" aria-label="Cerrar panel" tabIndex={-1}
        className={`absolute inset-0 ${overlayStyles.backdrop}`} onClick={close} disabled={busy} />
      <FooterContext.Provider value={footerNode}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={ariaLabel ? undefined : titleId} aria-label={ariaLabel} aria-describedby={subtitle ? subtitleId : undefined} aria-busy={busy || undefined}
        className={`relative flex h-dvh w-full max-w-[560px] min-w-0 flex-col bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.2)] ${className}`}>
        <header className={overlayStyles.header}>
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[1.32px] text-[#3b6ef5]">{eyebrow}</p>}
            <h2 id={titleId} className={overlayStyles.title}>{title}</h2>
            {subtitle && <p id={subtitleId} className={overlayStyles.subtitle}>{subtitle}</p>}
          </div>
          <button ref={closeRef} type="button" onClick={close} disabled={busy} aria-label="Cerrar" className={overlayStyles.close}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <div className={overlayStyles.body}>{children}</div>
        <footer ref={setFooterNode} className={`${overlayStyles.footer} empty:hidden`}>{footer}</footer>
      </section>
      </FooterContext.Provider>
    </div></OverlayParentContext.Provider>, document.body,
  );
}
