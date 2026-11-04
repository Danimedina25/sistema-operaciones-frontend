import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CashBankDepositOutflow } from './CashBankDepositOutflow';

const mocks = vi.hoisted(() => ({
  previewSufficient: false,
  register: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({
  user: { userId: 4 }, hasRole: (roles: string[]) => roles.includes('JEFA_CAJAS'),
}) }));
vi.mock('@/shared/utils/period', async importOriginal => ({ ...(await importOriginal<typeof import('@/shared/utils/period')>()), officeToday: () => '2026-10-16' }));
vi.mock('@/modules/bank-accounts/api/bank-accounts.api', () => ({ getBankAccounts: async () => [
  { id: 1, banco: 'BANORTE', titular: 'Adriana Pérez', numeroCuenta: '1234568998', activo: true },
  { id: 2, banco: 'SCOTIABANK', titular: 'Bulmaro Luna', numeroCuenta: '1234565843', activo: true },
] }));
vi.mock('@/modules/caja-general/api/caja-general.api', () => ({ cajaGeneralApi: { latest: async () => ({ fecha: '2026-10-16', closedAt: null }) } }));
vi.mock('@/modules/operations/api/operations-storage.api', () => ({ uploadOperationProof: mocks.upload }));
vi.mock('./api', () => ({
  depositMethodLabel: { VENTANILLA: 'Ventanilla', CAJERO: 'Cajero', OXXO: 'OXXO' },
  cashBankDepositsApi: {
    preview: async (amount: number) => ({ saldoCaja: 10000, saldoCuenta: 0, reservadoEnTransito: 0, monto: amount, saldoAlConfirmar: 10000 - amount, suficiente: mocks.previewSufficient }),
    register: mocks.register,
    returns: async () => [],
    list: async () => [
      { id: 1, origen: 'CHEQUE', registradoEn: '2026-10-15T10:00:00', cuenta: 'CUENTA CHEQUE', cuentaTitular: 'Titular cheque', forma: 'CHEQUE', estatus: 'PENDIENTE', monto: 75 },
      { id: 2, version: 0, origen: 'EFECTIVO_CAJA', registradoEn: '2026-10-15T11:00:00', bankAccountId: 1,
        cuenta: 'CUENTA EFECTIVO', cuentaTitular: 'Adriana Pérez', forma: 'VENTANILLA', estatus: 'PENDIENTE', monto: 300,
        referencia: 'ABC123', comprobanteSalidaUrl: 'https://example.test/proof', denominaciones: { B_100: 3 } },
      { id: 3, origen: 'EFECTIVO_CAJA', registradoEn: '2026-10-14T11:00:00', cuenta: 'CUENTA CONFIRMADA', cuentaTitular: 'Titular confirmada', forma: 'VENTANILLA', estatus: 'CONFIRMADO', monto: 100 },
      { id: 4, origen: 'EFECTIVO_CAJA', registradoEn: '2026-10-13T11:00:00', cuenta: 'CUENTA SIN DESGLOSE', cuentaTitular: 'Titular sin desglose', forma: 'VENTANILLA', estatus: 'PENDIENTE', monto: 50 },
    ],
  },
}));

describe('Salidas de efectivo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.previewSufficient = false;
    mocks.register.mockResolvedValue({ id: 10 });
    mocks.upload.mockResolvedValue({ downloadUrl: 'https://example.test/receipt' });
  });

  function mount() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><CashBankDepositOutflow /></MemoryRouter></QueryClientProvider>);
  }

  async function selectAccount() {
    const account = await screen.findByRole('combobox', { name: 'Cuenta bancaria destino' });
    await waitFor(() => expect(account).toBeEnabled());
    fireEvent.focus(account);
    fireEvent.change(account, { target: { value: 'adriana' } });
    fireEvent.click(screen.getByRole('option', { name: /Adriana Pérez/ }));
  }

  function attachProof() {
    fireEvent.change(screen.getByLabelText('Comprobante de salida'), {
      target: { files: [new File(['comprobante'], 'comprobante.png', { type: 'image/png' })] },
    });
  }

  it('muestra solo depósitos de efectivo en los envíos recientes', async () => {
    mount();
    const section = await screen.findByText('CUENTA EFECTIVO');
    const recent = section.closest('section');
    expect(recent).not.toBeNull();
    expect(within(recent!).getByText('CUENTA EFECTIVO')).toBeInTheDocument();
    expect(within(recent!).getByText('Adriana Pérez')).toBeInTheDocument();
    expect(within(recent!).queryByText('CUENTA CHEQUE')).toBeNull();
  });

  it('filtra y selecciona la cuenta bancaria en un solo campo', async () => {
    mount();
    const account = await screen.findByRole('combobox', { name: 'Cuenta bancaria destino' });
    await waitFor(() => expect(account).toBeEnabled());
    fireEvent.focus(account);
    fireEvent.change(account, { target: { value: 'bulmaro' } });
    expect(screen.getByRole('option', { name: /Bulmaro Luna/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Adriana Pérez/ })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /Bulmaro Luna/ }));
    expect((account as HTMLInputElement).value).toContain('Bulmaro Luna');
    fireEvent.change(account, { target: { value: 'adriana' } });
    expect(account).toHaveValue('adriana');
    expect(screen.getByRole('option', { name: /Adriana Pérez/ })).toBeInTheDocument();
  });

  it('permite abrir la edición solo del envío de efectivo pendiente', async () => {
    mount();
    const section = (await screen.findByText('CUENTA EFECTIVO')).closest('section')!;
    expect(within(section).getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
    fireEvent.click(within(section).getAllByRole('button', { name: 'Editar' })[0]);
    expect(screen.getByRole('dialog', { name: 'Editar envío #2' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument();
    const preview = screen.getByRole('region', { name: 'Comprobante guardado' });
    expect(within(preview).getByRole('img', { name: 'Miniatura del comprobante guardado' })).toHaveAttribute('src', 'https://example.test/proof');
    fireEvent.error(within(preview).getByRole('img', { name: 'Miniatura del comprobante guardado' }));
    expect(within(preview).getByText('No se pudo mostrar la miniatura.')).toBeInTheDocument();
    expect(within(preview).getByRole('link', { name: 'Abrir comprobante completo' })).toHaveAttribute('href', 'https://example.test/proof');
  });

  it('no se cae ni permite guardar si la API aún no entrega desglose y versión', async () => {
    mount();
    const section = (await screen.findByText('CUENTA SIN DESGLOSE')).closest('section')!;
    fireEvent.click(within(section).getAllByRole('button', { name: 'Editar' })[1]);
    expect(screen.getByRole('dialog', { name: 'Editar envío #4' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar los datos completos del envío');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
  });

  it('avisa faltantes y sobrantes al editar denominaciones y habilita el envío al cuadrar', async () => {
    mocks.previewSufficient = true;
    mount();
    await selectAccount();
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1200' } });
    attachProof();
    const submit = screen.getByRole('button', { name: 'Registrar envío' });
    fireEvent.change(screen.getByLabelText('Cantidad de $1,000.00'), { target: { value: '1' } });
    expect(screen.getByRole('alert')).toHaveTextContent('El desglose debe sumar exactamente el importe.');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Cantidad de $1,000.00'), { target: { value: '5' } });
    expect(screen.getByRole('alert')).toHaveTextContent('El desglose debe sumar exactamente el importe.');
    fireEvent.submit(submit.closest('form')!);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.register).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Cantidad de $1,000.00'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '2' } });
    expect(screen.queryByText('El desglose debe sumar exactamente el importe.')).not.toBeInTheDocument();
    expect(screen.getByText('Total contado $1,200.00 · cuadra con el monto')).toBeInTheDocument();
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1300' } });
    expect(screen.getByRole('alert')).toHaveTextContent('El desglose debe sumar exactamente el importe.');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1200' } });
    expect(screen.queryByText('El desglose debe sumar exactamente el importe.')).not.toBeInTheDocument();
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '-1' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa las cantidades capturadas.');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '2' } });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith(expect.objectContaining({
      monto: 1200, denominaciones: expect.objectContaining({ D1000: 1, D100: 2 }),
    })));
  });

  it('mantiene el botón deshabilitado con campos obligatorios incompletos o saldo insuficiente', async () => {
    mocks.previewSufficient = true;
    mount();
    const submit = screen.getByRole('button', { name: 'Registrar envío' });
    expect(submit).toBeDisabled();
    await selectAccount();
    fireEvent.change(screen.getByLabelText('Cantidad de $1,000.00'), { target: { value: '1' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Captura un monto válido para comprobar el desglose.');
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1000' } });
    expect(screen.queryByText('Captura un monto válido para comprobar el desglose.')).not.toBeInTheDocument();
    expect(submit).toBeDisabled();
    attachProof();
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(submit).toBeDisabled();
    mocks.previewSufficient = false;
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1001' } });
    attachProof();
    fireEvent.change(screen.getByLabelText('Cantidad de $1.00'), { target: { value: '1' } });
    await waitFor(() => expect(screen.queryByText('El desglose debe sumar exactamente el importe.')).not.toBeInTheDocument());
    expect(submit).toBeDisabled();
    expect(mocks.register).not.toHaveBeenCalled();
  });
});
