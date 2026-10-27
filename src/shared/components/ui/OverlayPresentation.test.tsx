import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';
import { ActionDrawer } from './ActionDrawer';
import { overlayStyles } from './overlay-styles';

describe('presentación común de ventanas', () => {
  it.each(['default', 'light'] as const)('el modal %s comparte el encabezado del panel y mantiene las acciones fuera del scroll', variant => {
    render(<Modal open variant={variant} title="Confirmar" subtitle="Datos de referencia" onClose={vi.fn()} footer={<button>Continuar</button>}><input aria-label="Dato" /></Modal>);
    const dialog = screen.getByRole('dialog', { name: 'Confirmar' });
    const header = dialog.querySelector('header')!;
    expect(header.className).toBe(overlayStyles.header);
    expect(within(dialog).getByRole('heading')).toHaveClass('text-slate-950');
    expect(dialog).toHaveAccessibleDescription('Datos de referencia');
    expect(dialog.querySelector('footer')).toContainElement(screen.getByRole('button', { name: 'Continuar' }));
    expect(dialog.querySelector('.modal-content')).not.toContainElement(screen.getByRole('button', { name: 'Continuar' }));
  });

  it.each(['modal', 'panel'])('bloquea el cierre por Escape, botón y fondo mientras guarda (%s)', kind => {
    const close = vi.fn();
    const Component = kind === 'modal' ? Modal : ActionDrawer;
    const view = render(<Component open busy title="Guardar" onClose={close}><input /></Component>);
    const dialog = screen.getByRole('dialog', { name: 'Guardar' });
    expect(dialog).toHaveAttribute('aria-busy', 'true');
    const button = within(dialog).getByRole('button', { name: kind === 'modal' ? 'Cerrar modal' : 'Cerrar' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    if (kind === 'modal') fireEvent.click(dialog.closest('[data-overlay-root]')!);
    else fireEvent.click(screen.getByRole('button', { name: 'Cerrar panel' }));
    expect(close).not.toHaveBeenCalled();
    view.rerender(<Component open title="Guardar" onClose={close}><input /></Component>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).toHaveBeenCalledTimes(1);
  });
});
