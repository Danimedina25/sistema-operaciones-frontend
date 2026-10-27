import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CashBankDepositIncome } from './CashBankDepositIncome';

const mocks = vi.hoisted(() => ({
  pending: vi.fn(), summary: vi.fn(), confirm: vi.fn(), reject: vi.fn(), upload: vi.fn(),
  roles: ['JEFA_CUENTAS'] as string[],
}));
vi.mock('./api', () => ({ depositMethodLabel: { VENTANILLA: 'Ventanilla', CAJERO: 'Cajero', OXXO: 'OXXO' }, cashBankDepositsApi: {
  pending: () => mocks.pending(), summary: () => mocks.summary(),
  confirm: (...args: unknown[]) => mocks.confirm(...args),
  reject: (...args: unknown[]) => mocks.reject(...args),
} }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({
  user: { userId: 4 }, hasRole: (roles: string[]) => roles.some(role => mocks.roles.includes(role)),
}) }));
vi.mock('@/modules/operations/api/operations-storage.api', () => ({
  uploadOperationProof: (...args: unknown[]) => mocks.upload(...args),
}));

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><CashBankDepositIncome /></MemoryRouter></QueryClientProvider>);
}
const row = {
  id: 12, origen: 'EFECTIVO_CAJA', bankAccountId: 9, cuenta: 'BANORTE ••••8998',
  cuentaTitular: 'Oficina', monto: 300, forma: 'VENTANILLA', referencia: 'ABC',
  comprobanteSalidaUrl: 'https://example.test/salida.pdf', comprobanteBancoUrl: null,
  estatus: 'PENDIENTE', motivo: null, registradoEn: '2026-10-15T10:00:00',
  registradoPorNombre: 'Jefa de Cajas', resueltoEn: null, resueltoPorNombre: null,
  cashMovementId: null,
};

describe('Envíos de Caja en Entradas bancarias', () => {
  beforeEach(() => {
    mocks.roles = ['JEFA_CUENTAS'];
    mocks.pending.mockReset().mockResolvedValue([row]);
    mocks.summary.mockReset().mockResolvedValue({ count: 1, amount: 300 });
    mocks.confirm.mockReset().mockResolvedValue({ ...row, estatus: 'CONFIRMADO' });
    mocks.reject.mockReset().mockResolvedValue({ ...row, estatus: 'RECHAZADO_PENDIENTE_DEVOLUCION' });
    mocks.upload.mockReset().mockResolvedValue({ downloadUrl: 'https://example.test/banco.pdf' });
  });

  it('confirma desde el panel solo después de adjuntar comprobante bancario', async () => {
    mount();
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Titular: Oficina')).toBeInTheDocument();
    fireEvent.click(within(table).getByRole('button', { name: 'Confirmar' }));
    expect(within(screen.getByRole('dialog', { name: 'Confirmar depósito bancario' })).getByText('Titular de la cuenta')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar depósito' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Adjunta el comprobante bancario');
    const file = new File(['comprobante'], 'banco.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Comprobante bancario'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar depósito' }));
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledWith(12, 'https://example.test/banco.pdf'));
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });

  it('mantiene la bandeja en consulta para Gerente', async () => {
    mocks.roles = ['GERENTE'];
    mount();
    const table = await screen.findByRole('table');
    expect(within(table).queryByRole('button', { name: 'Confirmar' })).toBeNull();
    expect(within(table).getByText('Solo consulta')).toBeInTheDocument();
  });

  it('identifica el cheque y guarda su comprobante bancario en la operación', async () => {
    mocks.pending.mockResolvedValue([{ ...row, origen: 'CHEQUE', forma: 'CHEQUE',
      chequePaymentId: 34, operationId: 27, numeroCheque: '0089', cashMovementId: null }]);
    mount();
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Cheque 0089')).toBeInTheDocument();
    fireEvent.click(within(table).getByRole('button', { name: 'Confirmar' }));
    expect(screen.getByRole('link', { name: 'Ver operación #27' })).toHaveAttribute('href', '/operaciones/27');
    expect(screen.queryByText(/Denominación/)).not.toBeInTheDocument();
    const file = new File(['comprobante'], 'banco.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Comprobante bancario'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar depósito' }));
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledWith(expect.objectContaining({ operationId: 27 })));
    expect(mocks.confirm).toHaveBeenCalledWith(12, 'https://example.test/banco.pdf');
  });
  it('muestra un solo monto y los errores en el resumen fijo; corregir el campo los retira', async () => {
    mount();
    fireEvent.click(within(await screen.findByRole('table')).getByRole('button', { name: 'Confirmar' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirmar depósito bancario' });
    expect(within(dialog).getAllByText('$300.00')).toHaveLength(1);
    expect(within(dialog).getAllByText('BANORTE ••••8998')).toHaveLength(1);
    const summary = within(dialog).getByRole('region', { name: 'Resumen del envío' });
    expect(summary).toHaveClass('sticky', 'top-0');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar depósito' }));
    expect(await within(summary).findByRole('alert')).toHaveTextContent('Adjunta el comprobante bancario');
    fireEvent.change(screen.getByLabelText('Comprobante bancario'), { target: { files: [new File(['x'], 'banco.pdf', { type: 'application/pdf' })] } });
    expect(within(summary).queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it('impide cerrar y enviar dos veces durante la confirmación y conserva los datos ante un error', async () => {
    let fail!: (error: unknown) => void;
    mocks.upload.mockImplementation(() => new Promise((_resolve, reject) => { fail = reject; }));
    mount();
    fireEvent.click(within(await screen.findByRole('table')).getByRole('button', { name: 'Confirmar' }));
    const file = new File(['x'], 'banco.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Comprobante bancario'), { target: { files: [file] } });
    const dialog = screen.getByRole('dialog', { name: 'Confirmar depósito bancario' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar depósito' }));
    expect(dialog).toHaveAttribute('aria-busy', 'true');
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cerrar' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Procesando...' })).toBeDisabled();
    fireEvent.submit(dialog.querySelector('form')!);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(dialog).toBeInTheDocument();
    fail({ isAxiosError: true, response: { data: { message: 'No se pudo subir el archivo' } } });
    const summary = within(dialog).getByRole('region', { name: 'Resumen del envío' });
    expect(await within(summary).findByRole('alert')).toHaveTextContent('No se pudo subir el archivo');
    expect(within(dialog).getByText('banco.pdf')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Confirmar depósito' })).toBeEnabled();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it('exige el motivo para rechazar y elimina el error al corregirlo', async () => {
    mount();
    fireEvent.click(within(await screen.findByRole('table')).getByRole('button', { name: 'Rechazar' }));
    const dialog = screen.getByRole('dialog', { name: 'Rechazar envío' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rechazar envío' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Indica el motivo');
    expect(mocks.reject).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText('Motivo del rechazo'), { target: { value: 'El depósito no coincide' } });
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rechazar envío' }));
    await waitFor(() => expect(mocks.reject).toHaveBeenCalledWith(12, 'El depósito no coincide'));
  });

});
