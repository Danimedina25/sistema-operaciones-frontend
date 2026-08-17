import { useCallback } from 'react';
import { buildWhatsAppShareUrl } from '@/shared/utils/whatsapp-link';

/**
 * Expone un helper estable para abrir un mensaje de WhatsApp ya armado
 * en una pestaña nueva. La construcción del enlace vive en
 * `shared/utils/whatsapp-link.ts` (pura y testeada); este hook solo la
 * envuelve para uso directo en componentes.
 */
export function useWhatsAppLink() {
  const openWhatsApp = useCallback((message: string, phoneNumber?: string | null) => {
    const url = buildWhatsAppShareUrl(message, phoneNumber);
    window.open(url, '_blank', 'noopener,noreferrer');
    return url;
  }, []);

  return { openWhatsApp, buildWhatsAppShareUrl };
}
