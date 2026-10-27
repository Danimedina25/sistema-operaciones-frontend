import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReceiptViewerLink } from './ReceiptViewerLink';
import { ActionDrawer } from './ActionDrawer';

describe('visor compartido de comprobantes', () => {
  it('abre la imagen sin otra pestaña y conserva el panel de origen al cerrar', () => {
    const open = vi.spyOn(window, 'open');
    const close = vi.fn();
    render(<ActionDrawer open title="Detalle" onClose={close}><ReceiptViewerLink href="https://files/recibo.jpg">Ver comprobante</ReceiptViewerLink></ActionDrawer>);
    const link = screen.getByRole('link', { name: 'Ver comprobante' });
    expect(link).not.toHaveAttribute('target');
    fireEvent.click(link);
    const viewer = screen.getByRole('dialog', { name: 'Comprobante' });
    const parent = screen.getByRole('dialog', { name: 'Detalle' });
    expect(within(viewer).getByRole('img')).toHaveAttribute('src', 'https://files/recibo.jpg');
    expect(Number(viewer.style.zIndex)).toBeGreaterThan(Number(parent.closest('[data-overlay-root]')!.getAttribute('style')?.match(/z-index: (\d+)/)?.[1]));
    fireEvent.click(within(viewer).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog', { name: 'Comprobante' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Detalle' })).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('reconoce imágenes recién adjuntadas por su tipo aunque su URL sea blob', () => {
    render(<ReceiptViewerLink href="blob:imagen-local" mimeType="image/png">Abrir comprobante</ReceiptViewerLink>);
    fireEvent.click(screen.getByRole('link'));
    const viewer = screen.getByRole('dialog', { name: 'Comprobante' });
    expect(within(viewer).getByRole('img')).toHaveAttribute('src', 'blob:imagen-local');
    expect(within(viewer).getByRole('button', { name: /Acercar/i })).toBeInTheDocument();
  });

  it('muestra también los comprobantes PDF dentro del sistema', () => {
    render(<ReceiptViewerLink href="https://files/recibo.pdf">Ver PDF</ReceiptViewerLink>);
    fireEvent.click(screen.getByRole('link'));
    const viewer = screen.getByRole('dialog', { name: 'Comprobante' });
    expect(viewer.querySelector('iframe')).toHaveAttribute('src', 'https://files/recibo.pdf');
    expect(within(viewer).queryByText('Abrir en otra pestaña')).not.toBeInTheDocument();
  });
});
