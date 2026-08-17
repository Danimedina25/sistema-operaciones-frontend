import { describe, expect, it } from 'vitest';
import { buildWhatsAppShareUrl } from './whatsapp-link';

describe('buildWhatsAppShareUrl', () => {
  it('genera un enlace sin destinatario cuando no hay teléfono', () => {
    const url = buildWhatsAppShareUrl('Hola mundo');
    expect(url).toBe('https://wa.me/?text=Hola%20mundo');
  });

  it('genera un enlace con destinatario cuando hay teléfono', () => {
    const url = buildWhatsAppShareUrl('Hola', '55 1234 5678');
    expect(url).toBe('https://wa.me/5512345678?text=Hola');
  });

  it('codifica saltos de línea y caracteres especiales', () => {
    const url = buildWhatsAppShareUrl('Línea 1\nLínea 2');
    expect(url).toContain('%0A');
    expect(url).not.toContain('\n');
  });

  it('cae al enlace sin destinatario si el teléfono no tiene dígitos', () => {
    const url = buildWhatsAppShareUrl('Hola', 'sin-numero');
    expect(url).toBe('https://wa.me/?text=Hola');
  });
});
