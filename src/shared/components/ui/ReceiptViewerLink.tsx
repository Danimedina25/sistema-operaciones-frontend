import { useState, type AnchorHTMLAttributes } from 'react';
import { ValidationReceiptViewerModal } from '@/modules/operations/components/ValidationReceiptViewerModal';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; mimeType?: string; viewerTitle?: string };

/** Abre comprobantes en el visor compartido conservando el contexto de la pantalla. */
export function ReceiptViewerLink({ href, mimeType, viewerTitle = 'Comprobante', children, onClick, target: _target, rel: _rel, ...props }: Props) {
  const [open, setOpen] = useState(false);
  return <>
    <a {...props} href={href} onClick={event => {
      event.preventDefault();
      onClick?.(event);
      event.currentTarget.focus();
      setOpen(true);
    }}>{children}</a>
    {open && <ValidationReceiptViewerModal key={href} receiptUrl={href} mimeType={mimeType} title={viewerTitle}
      canReplace={false} isSaving={false} onClose={() => setOpen(false)} onReplace={() => undefined} />}
  </>;
}
