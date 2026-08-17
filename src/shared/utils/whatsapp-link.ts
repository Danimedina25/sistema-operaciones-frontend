/**
 * Construye un enlace `https://wa.me/` a partir de un mensaje ya armado.
 * No decide el contenido del mensaje, solo el encoding y la URL. Si se
 * provee un número de teléfono, se usa como destinatario directo; si no,
 * se genera un enlace sin destinatario (el usuario elige el chat a mano).
 */
export function buildWhatsAppShareUrl(message: string, phoneNumber?: string | null): string {
  const encodedMessage = encodeURIComponent(message);

  if (phoneNumber) {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly) {
      return `https://wa.me/${digitsOnly}?text=${encodedMessage}`;
    }
  }

  return `https://wa.me/?text=${encodedMessage}`;
}
