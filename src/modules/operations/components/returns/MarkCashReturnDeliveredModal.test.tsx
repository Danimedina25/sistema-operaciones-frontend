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
  confirmadoPorSocio: true,
};

function imageFile(name = 'entrega.png') {
  return new File(['x'], name, { type: 'image/png' });
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error('no file input');
  return input as HTMLInputElement;
}

function selectEl() {
  return screen.getByRole('combobox', { name: /persona que (recibió|realizó)/i });
}

function confirmButton() {
  return screen.getByRole('button', { name: /sí, marcar como entregado/i });
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
  it('lista los autorizados + la opción "Otra persona (no autorizada)"', () => {
    renderModal();

    const options = within(selectEl()).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual([
      'Selecciona una persona',
      'María Gómez Díaz',
      'Juan Pérez',
      'Otra persona (no autorizada)',
    ]);
  });

  it('limpia valores vacíos y duplicados de la lista permitida', () => {
    renderModal({
      target: {
        ...baseTarget,
        autorizados: ['María Gómez Díaz', '  maría   gómez díaz ', '', '   ', 'Juan Pérez'],
      },
    });

    const options = within(selectEl()).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual([
      'Selecciona una persona',
      'María Gómez Díaz',
      'Juan Pérez',
      'Otra persona (no autorizada)',
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

  it('el botón está deshabilitado sin receptor / sin foto', async () => {
    const user = userEvent.setup();
    renderModal();
    expect(confirmButton()).toBeDisabled();

    await user.selectOptions(selectEl(), 'María Gómez Díaz');
    expect(confirmButton()).toBeDisabled();
  });

  it('sigue deshabilitado con foto pero sin receptor', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.upload(fileInput(), imageFile());
    expect(confirmButton()).toBeDisabled();
  });

  it('habilita y envía el autorizado seleccionado', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderModal();

    await user.selectOptions(selectEl(), 'Juan Pérez');
    await user.upload(fileInput(), imageFile());

    expect(confirmButton()).toBeEnabled();
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(42, 1500, expect.any(File), 'Juan Pérez');
  });

  it('permite capturar una persona ajena a la lista con "Otra persona"', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderModal();

    // Sin elegir "Otra persona" no hay input de texto.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await user.selectOptions(selectEl(), 'Otra persona (no autorizada)');
    const input = screen.getByRole('textbox');
    await user.type(input, '  Pedro   Ramírez  ');
    await user.upload(fileInput(), imageFile());

    expect(screen.getByText(/se registrará como excepción/i)).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();

    await user.click(confirmButton());
    // El nombre va normalizado (trim + espacios colapsados).
    expect(onConfirm).toHaveBeenCalledWith(42, 1500, expect.any(File), 'Pedro Ramírez');
  });

  it('sin autorizados: muestra directamente el campo de texto (sin bloqueo)', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderModal({ target: { ...baseTarget, autorizados: [] } });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      screen.getByText(/no tiene personas autorizadas registradas/i),
    ).toBeInTheDocument();

    await user.type(screen.getByRole('textbox'), 'Alguien Externo');
    await user.upload(fileInput(), imageFile());

    expect(confirmButton()).toBeEnabled();
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(42, 1500, expect.any(File), 'Alguien Externo');
  });

  it('mensaje según confirmación del socio', () => {
    const { rerender } = renderModal();
    expect(screen.getByText(/el socio comercial ya confirmó/i)).toBeInTheDocument();

    rerender(
      <MarkCashReturnDeliveredModal
        target={{ ...baseTarget, confirmadoPorSocio: false }}
        isSubmitting={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/quedará en confirmación parcial/i)).toBeInTheDocument();
  });

  it('previene el doble envío mientras isSubmitting', () => {
    renderModal({ isSubmitting: true });
    expect(screen.getByRole('button', { name: /subiendo evidencia/i })).toBeDisabled();
  });

  it('reinicia receptor y foto al cambiar de parcialidad', async () => {
    const user = userEvent.setup();
    const { rerender } = renderModal();

    await user.selectOptions(selectEl(), 'María Gómez Díaz');
    await user.upload(fileInput(), imageFile());
    expect(confirmButton()).toBeEnabled();

    rerender(
      <MarkCashReturnDeliveredModal
        target={{ ...baseTarget, id: 99 }}
        isSubmitting={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(selectEl()).toHaveValue('');
    expect(confirmButton()).toBeDisabled();
  });
});
