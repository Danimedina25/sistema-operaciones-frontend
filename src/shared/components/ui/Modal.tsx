import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { OverlayParentContext, useOverlay } from '@/shared/hooks/use-overlay';
import { X } from 'lucide-react';
import { overlayStyles } from './overlay-styles';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Compatibilidad con pantallas existentes: ambas variantes usan la misma base visual. */
  variant?: 'default' | 'light';
  subtitle?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  size?: 'compact' | 'default' | 'wide';
  busy?: boolean;
}

const sizes = { compact: 'sm:max-w-[480px]', default: 'sm:max-w-[820px]', wide: 'sm:max-w-[1360px]' };

export function Modal({ open, title, onClose, children, subtitle, icon, footer, size = 'default', busy = false }: ModalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const subtitleId = useId();
  const close = () => { if (!busy) onClose(); };
  const { overlayId, zIndex } = useOverlay(open, rootRef, close);
  if (!open) return null;

  return createPortal(<OverlayParentContext.Provider value={overlayId}>
    <div ref={rootRef} tabIndex={-1} style={{ zIndex }} data-overlay-root
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      className={`fixed inset-0 flex items-end justify-center sm:items-center sm:p-6 ${overlayStyles.backdrop}`}>
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={subtitle ? subtitleId : undefined} aria-busy={busy || undefined}
        className={`flex max-h-dvh w-full min-w-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-2xl ${sizes[size]}`}>
        <header className={overlayStyles.header}>
          {icon && <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{icon}</span>}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className={overlayStyles.title}>{title}</h2>
            {subtitle && <p id={subtitleId} className={overlayStyles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" onClick={close} disabled={busy} aria-label="Cerrar modal" className={overlayStyles.close}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <div className={`modal-content ${overlayStyles.body} ${size === 'wide' ? 'bg-slate-50/70' : ''}`}>{children}</div>
        {footer && <footer className={`${overlayStyles.footer} flex flex-wrap justify-end gap-3`}>{footer}</footer>}
      </section>
    </div>
  </OverlayParentContext.Provider>, document.body);
}
