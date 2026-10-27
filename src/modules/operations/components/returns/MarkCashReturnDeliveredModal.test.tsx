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

async function fillCashBreakdown(user: ReturnType<typeof userEvent.setup>) {
  const quantity = screen.getByLabelText('Cantidad de $100.00');
  await user.clear(quantity);
  await user.type(quantity, '100');
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
  it('muestra el conteo y la diferencia para faltantes, sobrantes y el importe exacto', async () => {
    const user = userEvent.setup();
    renderModal();
    expect(screen.getAllByRole('table')).toHaveLength(2);
    const summary = screen.getByRole('region', { name: 'Resumen de entrega' });
    expect(within(summary).getByRole('status')).toHaveTextContent('Faltan $10,000.00 por contar');
    expect(within(summary).getByRole('status')).toHaveTextContent('$10,000.00');
    const quantity = screen.getByLabelText('Cantidad de $100.00');
    await user.clear(quantity);
    await user.type(quantity, '101');
    expect(within(summary).getByRole('status')).toHaveTextContent('Sobran $100.00 en el conteo');
    expect(within(summary).getByRole('status')).toHaveTextContent('$100.00');
    expect(confirmButton()).toBeDisabled();
    await user.clear(quantity);
    await user.type(quantity, '100');
    expect(within(summary).getByRole('status')).toHaveTextContent('Conteo completo');
    expect(within(summary).getByRole('status')).toHaveTextContent('Conteo completo');
  });

  it('muestra la suma de billetes y monedas en negritas junto al desglose', async () => {
    const user = userEvent.setup();
    renderModal();
    const total = screen.getByLabelText('Total de denominaciones');
    expect(total).toHaveClass('font-bold');
    expect(within(total).getByText('$0.00')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Cantidad de $50.00'), '1');
    await user.type(screen.getByLabelText('Cantidad de $20.00'), '2');
    await user.type(screen.getByLabelText('Cantidad de $0.50'), '1');
    expect(within(total).getByText('$90.50').tagName).toBe('STRONG');
    expect(total.closest('section[aria-label="Desglose y resumen de entrega"]')).toContainElement(screen.getAllByRole('table')[0]);
    expect(total.closest('section[aria-label="Desglose y resumen de entrega"]')).toContainElement(screen.getAllByRole('table')[1]);
    expect(screen.getAllByText('Total contado')).toHaveLength(1);
    expect(screen.queryByText(/Diferencia:/)).not.toBeInTheDocument();
  });

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

  it('exige y envía las denominaciones para retiro sin tarjeta', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderModal({
      target: { ...baseTarget, tipoPago: 'RETIRO_SIN_TARJETA' },
    });

    expect(screen.getByText('Desglose por denominación')).toBeInTheDocument();
    await user.selectOptions(selectEl(), 'Juan Pérez');
    await user.upload(fileInput(), imageFile());
    expect(confirmButton()).toBeDisabled();
    await fillCashBreakdown(user);
    expect(confirmButton()).toBeEnabled();
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(
      42,
      1500,
      expect.any(File),
      'Juan Pérez',
      expect.objectContaining({ D100: 100 }),
    );
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
    await fillCashBreakdown(user);

    expect(confirmButton()).toBeEnabled();
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(42, 1500, expect.any(File), 'Juan Pérez', expect.objectContaining({ D100: 100 }));
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
    await fillCashBreakdown(user);

    expect(screen.getByText(/se registrará como excepción/i)).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();

    await user.click(confirmButton());
    // El nombre va normalizado (trim + espacios colapsados).
    expect(onConfirm).toHaveBeenCalledWith(42, 1500, expect.any(File), 'Pedro Ramírez', expect.objectContaining({ D100: 100 }));
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
    await fillCashBreakdown(user);

    expect(confirmButton()).toBeEnabled();
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(42, 1500, expect.any(File), 'Alguien Externo', expect.objectContaining({ D100: 100 }));
  });

  it('mensaje según confirmación del socio', () => {
    const { rerender } = renderModal();
    expect(screen.getByText(/recepción confirmada por el socio/i)).toBeInTheDocument();

    rerender(
      <MarkCashReturnDeliveredModal
        target={{ ...baseTarget, confirmadoPorSocio: false }}
        isSubmitting={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/pendiente de confirmación del socio/i)).toBeInTheDocument();
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
    await fillCashBreakdown(user);
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
  it('mantiene el error del servidor junto al conteo y conserva receptor y fotografía', async () => {
    const user = userEvent.setup();
    const confirm = vi.fn().mockRejectedValue({ isAxiosError: true, response: { data: { message: 'La caja está cerrada' } } });
    renderModal({ onConfirm: confirm });
    await user.selectOptions(selectEl(), 'Juan Pérez');
    await user.upload(fileInput(), imageFile());
    await fillCashBreakdown(user);
    await user.click(confirmButton());
    const summary = screen.getByRole('region', { name: 'Resumen de entrega' });
    expect(await within(summary).findByRole('alert')).toHaveTextContent('La caja está cerrada');
    expect(selectEl()).toHaveValue('Juan Pérez');
    expect(screen.getByLabelText('Cantidad de $100.00')).toHaveValue(100);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

});
