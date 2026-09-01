import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MarkCashReturnDeliveredModal } from './MarkCashReturnDeliveredModal';
import type { CashDeliveryTarget } from '@/modules/operations/utils/return-installment';

const baseTarget: CashDeliveryTarget = {
  id: 42,
  operationId: 1500,
  monto: 10000,
  tipoPago: 'EFECTIVO',
  clienteNombre: 'ACME',
  autorizados: ['María Gómez Díaz', 'Juan Pérez'],
  scheduledAt: null,
};

function imageFile(name = 'entrega.png') {
  return new File(['x'], name, { type: 'image/png' });
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error('no file input');
  return input as HTMLInputElement;
}

function renderModal(overrides: Partial<Parameters<typeof MarkCashReturnDeliveredModal>[0]> = {}) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <MarkCashReturnDeliveredModal
      target={baseTarget}
      isSubmitting={false}
      onConfirm={onConfirm}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { onConfirm, onClose, ...utils };
}

describe('MarkCashReturnDeliveredModal', () => {
  it('muestra las personas autorizadas en el selector, sin texto libre ni "Otra persona"', () => {
    renderModal();

    const select = screen.getByRole('combobox', { name: /persona que recibió/i });
    const options = within(select).getAllByRole('option').map((o) => o.textContent);

    expect(options).toEqual([
      'Selecciona una persona autorizada',
      'María Gómez Díaz',
      'Juan Pérez',
    ]);
    expect(options).not.toContain('Otra persona');
  });

  it('limpia valores vacíos y duplicados de la lista permitida', () => {
    renderModal({
      target: {
        ...baseTarget,
        autorizados: ['María Gómez Díaz', '  maría   gómez díaz ', '', '   ', 'Juan Pérez'],
      },
    });

    const select = screen.getByRole('combobox', { name: /persona que recibió/i });
    const options = within(select).getAllByRole('option').map((o) => o.textContent);

    expect(options).toEqual([
      'Selecciona una persona autorizada',
      'María Gómez Díaz',
      'Juan Pérez',
    ]);
  });

  it('cambia la etiqueta entre efectivo y retiro sin tarjeta', () => {
    const { rerender } = renderModal();
    expect(
      screen.getByRole('combobox', { name: /persona que recibió el efectivo/i }),
    ).toBeInTheDocument();

    rerender(
      <MarkCashReturnDeliveredModal
        target={{ ...baseTarget, tipoPago: 'RETIRO_SIN_TARJETA' }}
        isSubmitting={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: /persona que realizó el retiro/i }),
    ).toBeInTheDocument();
  });

  it('mantiene el botón deshabilitado sin receptor y sin foto', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /sí, marcar como entregado/i })).toBeDisabled();
  });

  it('sigue deshabilitado con receptor pero sin foto', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /persona que recibió/i }),
      'María Gómez Díaz',
    );

    expect(screen.getByRole('button', { name: /sí, marcar como entregado/i })).toBeDisabled();
  });

  it('sigue deshabilitado con foto pero sin receptor', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.upload(fileInput(), imageFile());

    expect(screen.getByRole('button', { name: /sí, marcar como entregado/i })).toBeDisabled();
  });

  it('habilita el botón con receptor y foto válidos y envía el receptor seleccionado', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderModal();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /persona que recibió/i }),
      'Juan Pérez',
    );
    await user.upload(fileInput(), imageFile());

    const button = screen.getByRole('button', { name: /sí, marcar como entregado/i });
    expect(button).toBeEnabled();

    await user.click(button);
    expect(onConfirm).toHaveBeenCalledWith(42, 1500, expect.any(File), 'Juan Pérez');
  });

  it('bloquea el cierre y avisa cuando no hay personas autorizadas', () => {
    renderModal({ target: { ...baseTarget, autorizados: [] } });

    expect(
      screen.getByText(/no tiene personas autorizadas para recibir/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: /persona que recibió/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sí, marcar como entregado/i })).toBeDisabled();
  });

  it('previene el doble envío mientras isSubmitting', () => {
    renderModal({ isSubmitting: true });
    expect(screen.getByRole('button', { name: /subiendo evidencia/i })).toBeDisabled();
  });

  it('reinicia receptor y foto al cambiar de parcialidad', async () => {
    const user = userEvent.setup();
    const { rerender } = renderModal();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /persona que recibió/i }),
      'María Gómez Díaz',
    );
    await user.upload(fileInput(), imageFile());
    expect(screen.getByRole('button', { name: /sí, marcar como entregado/i })).toBeEnabled();

    rerender(
      <MarkCashReturnDeliveredModal
        target={{ ...baseTarget, id: 99 }}
        isSubmitting={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: /persona que recibió/i })).toHaveValue('');
    expect(screen.getByRole('button', { name: /sí, marcar como entregado/i })).toBeDisabled();
  });
});
