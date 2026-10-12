import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ActionDrawer, ActionDrawerFooter } from './ActionDrawer';

it('muestra el panel con cuerpo desplazable y acciones fijas, y devuelve el foco al cerrar', () => {
  const close = vi.fn();
  const view = render(<>
    <button type="button">Abrir</button>
    <ActionDrawer open title="Operación #41" eyebrow="Validar pago de ingreso" onClose={close}
      footer={<button type="button">Validar ingreso</button>}>
      <input aria-label="Comprobante" />
    </ActionDrawer>
  </>);
  const dialog = screen.getByRole('dialog', { name: 'Operación #41' });
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(screen.getByRole('button', { name: 'Validar ingreso' }).closest('footer')).toBeInTheDocument();
  expect(screen.getByLabelText('Comprobante').closest('.overflow-y-auto')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(close).toHaveBeenCalledTimes(1);
  view.rerender(<button type="button">Abrir</button>);
  expect(screen.getByRole('button', { name: 'Abrir' })).toBeInTheDocument();
});

it('conserva el envío del formulario con el botón en el pie fijo', () => {
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  render(<ActionDrawer open title="Registrar pago" onClose={vi.fn()}>
    <form id="payment-test" onSubmit={submit}>
      <input aria-label="Monto" />
      <ActionDrawerFooter>
        <button type="submit" form="payment-test">Registrar</button>
      </ActionDrawerFooter>
    </form>
  </ActionDrawer>);
  const button = screen.getByRole('button', { name: 'Registrar' });
  expect(button.closest('footer')).toBeInTheDocument();
  fireEvent.click(button);
  expect(submit).toHaveBeenCalledTimes(1);
});
