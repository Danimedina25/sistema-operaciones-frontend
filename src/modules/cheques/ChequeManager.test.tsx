import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChequeManager } from './ChequeManager';
import type { Cheque } from './types';
const mocks = vi.hoisted(() => ({ command: vi.fn(), get: vi.fn(), upload: vi.fn(), accounts: vi.fn(), pendingDeposits: vi.fn(), confirmDeposit: vi.fn(), rejectDeposit: vi.fn(), role: 'JEFA_CUENTAS' }));
vi.mock('./api', () => ({ chequesApi: { byPayment: mocks.get, command: mocks.command } }));
vi.mock('@/modules/cash-bank-deposits/api', () => ({ cashBankDepositsApi: { pending: mocks.pendingDeposits, confirm: mocks.confirmDeposit, reject: mocks.rejectDeposit } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 }, hasRole: (roles: string[]) => roles.includes(mocks.role) }) }));
vi.mock('@/modules/operations/api/operations-storage.api', () => ({ uploadOperationProof: mocks.upload }));
vi.mock('@/modules/bank-accounts/api/bank-accounts.api', () => ({ getBankAccounts: mocks.accounts }));
vi.mock('@/modules/caja-general/api/caja-general.api', () => ({ cajaGeneralApi: { latest: vi.fn().mockResolvedValue({ id: 1, fecha: '2026-09-20', closedAt: null }) } }));
const cheque: Cheque = { id: 3, pagoId: 4, operacionId: 5, clienteNombre: 'Cliente', numeroCheque: '123', bancoEmisor: 'Banco', emisor: 'Emisor', beneficiario: 'Empresa', monto: 100, moneda: 'MXN', estado: 'POR_COBRAR', requiereConciliacion: false, version: 1, fechaRecepcion: '2026-09-20', cuentaDestinoId: null, cuentaDestinoEtiqueta: null, destinoCobro: null, comprobanteUrl: 'https://example.com/cheque', historial: [] };
function mount(onClose = vi.fn()) { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter><ChequeManager paymentId={4} onClose={onClose} /></MemoryRouter></QueryClientProvider>); }
const deposited: Cheque = { ...cheque, estado: 'DEPOSITADO', depositoCompartido: true, depositoId: 9, cuentaDestinoId: 8, destinoCobro: 'CUENTA_BANCARIA' };
const deposit = { id: 9, origen: 'CHEQUE', bankAccountId: 8, cuenta: 'BANORTE ••8998', cuentaTitular: 'Empresa', monto: 100, forma: 'VENTANILLA', referencia: null, comprobanteSalidaUrl: 'https://example.com/envio', comprobanteBancoUrl: null, estatus: 'PENDIENTE', motivo: null, registradoEn: '2026-09-20T10:00:00', registradoPorNombre: 'Jefa de Cajas', resueltoEn: null, resueltoPorNombre: null, cashMovementId: null, chequePaymentId: 4, operationId: 5, numeroCheque: '123', version: 1, denominaciones: {} };
beforeEach(() => { vi.clearAllMocks(); mocks.role = 'JEFA_CUENTAS'; mocks.get.mockResolvedValue(cheque); mocks.upload.mockResolvedValue({ downloadUrl: 'https://example.com/deposito' }); mocks.accounts.mockResolvedValue([{ id: 8, banco: 'Bajío', titular: 'Empresa', numeroCuenta: '123456', activo: true }]); mocks.pendingDeposits.mockResolvedValue([deposit]); mocks.confirmDeposit.mockResolvedValue({ ...deposit, estatus: 'CONFIRMADO' }); });
describe('shared cheque manager', () => {
  it('sends a deposit command and preserves its idempotency key on an uncertain retry', async () => {
    mocks.command.mockRejectedValueOnce(new Error('Respuesta incierta')).mockResolvedValueOnce({ ...cheque, estado: 'DEPOSITADO', version: 2 });
    mocks.role = 'JEFA_CAJAS'; mount();
    fireEvent.change(await screen.findByLabelText(/Acción/), { target: { value: 'DEPOSITAR' } });
    fireEvent.change(screen.getByLabelText(/Fecha efectiva/), { target: { value: '2026-09-20' } });
    const accountField = screen.getByRole('combobox', { name: 'Cuenta bancaria' });
    expect(screen.queryByLabelText('Buscar cuenta')).not.toBeInTheDocument();
    fireEvent.focus(accountField);
    fireEvent.change(accountField, { target: { value: 'Bajío' } });
    fireEvent.click(await screen.findByRole('option', { name: /Empresa — Bajío/ }));
    expect((accountField as HTMLInputElement).value).toContain('Empresa');
    await userEvent.upload(screen.getByLabelText(/Comprobante/), new File(['proof'], 'proof.pdf', { type: 'application/pdf' }));
    const form = (screen.getByRole('button', { name: 'Validar y enviar a depósito' }) as HTMLButtonElement).form!;
    // jsdom file validity does not track user-event's uploaded FileList.
    fireEvent.submit(form);
    await screen.findByRole('alert');
    expect(mocks.command).toHaveBeenCalledTimes(1);
    expect(mocks.command.mock.calls[0][1]).toMatchObject({ accion: 'DEPOSITAR', cuentaDestinoId: 8, version: 1, comprobanteUrl: 'https://example.com/deposito' });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar solicitud' }));
    await waitFor(() => expect(mocks.command).toHaveBeenCalledTimes(2));
    expect(mocks.command.mock.calls[1]).toEqual(mocks.command.mock.calls[0]);
    expect(mocks.upload).toHaveBeenCalledTimes(1);
  });
  it('keeps historical cheques read-only until reconciled', async () => {
    mocks.get.mockResolvedValue({ ...cheque, estado: null, requiereConciliacion: true }); mount();
    await screen.findByText(/Este cheque histórico requiere conciliación/);
    expect(screen.queryByLabelText(/Acción/)).not.toBeInTheDocument();
  });
  it('offers the head of cash a direct counted collection choice', async () => {
    mocks.role = 'JEFA_CAJAS'; mount(); await screen.findByLabelText(/Acción/);
    expect(screen.getByRole('option', { name: 'Se cobró en efectivo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Se depositará en una cuenta bancaria' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Enviar a cobro en efectivo' })).not.toBeInTheDocument();
    expect(mocks.command).not.toHaveBeenCalled();
  });
  it('captura el cobro en efectivo con las tablas de Caja e indica si el conteo cuadra con el cheque', async () => {
    mocks.role = 'JEFA_CAJAS'; mount();
    fireEvent.change(await screen.findByLabelText(/Acción/), { target: { value: 'CONFIRMAR_COBRO_EFECTIVO' } });
    expect(screen.getByRole('columnheader', { name: 'Billetes' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Monedas' })).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Resumen del cheque' });
    expect(within(summary).getByText('Total contado $0.00 · faltan $100.00')).toBeInTheDocument();
    expect(within(summary).queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Cantidad de $50.00'), { target: { value: '2' } });
    expect(within(summary).getByText('Total contado $100.00 · cuadra')).toBeInTheDocument();
    // Contar de más es un error visible en el resumen, no un pendiente.
    fireEvent.change(screen.getByLabelText('Cantidad de $50.00'), { target: { value: '3' } });
    expect(within(summary).getByText('Total contado $150.00 · sobran $50.00')).toBeInTheDocument();
    expect(within(summary).getByRole('alert')).toHaveTextContent('El conteo excede el monto por $50.00. Debe cuadrar exacto.');
  });
  it('valida sin la burbuja del navegador y muestra el error en el resumen', async () => {
    mocks.role = 'JEFA_CAJAS'; mount();
    fireEvent.change(await screen.findByLabelText(/Acción/), { target: { value: 'CONFIRMAR_COBRO_EFECTIVO' } });
    const form = (screen.getByLabelText(/Fecha efectiva/) as HTMLInputElement).form!;
    expect(form).toHaveAttribute('novalidate');
    fireEvent.submit(form);
    expect(await within(screen.getByRole('region', { name: 'Resumen del cheque' })).findByText('Selecciona una fecha válida.')).toBeInTheDocument();
    expect(mocks.command).not.toHaveBeenCalled();
  });
  it('muestra el monto y el error del servidor dentro del resumen fijo del cheque', async () => {
    mocks.command.mockRejectedValueOnce(new Error('El cheque cambió, recarga la información'));
    mocks.role = 'JEFA_CAJAS'; mount();
    fireEvent.change(await screen.findByLabelText(/Acción/), { target: { value: 'CONFIRMAR_COBRO_EFECTIVO' } });
    fireEvent.change(screen.getByLabelText(/Fecha efectiva/), { target: { value: '2026-09-20' } });
    fireEvent.change(screen.getByLabelText('Cantidad de $50.00'), { target: { value: '2' } });
    await screen.findByText(/Caja abierta/);
    fireEvent.submit((screen.getByRole('button', { name: 'Validar con este conteo' }) as HTMLButtonElement).form!);
    const card = screen.getByRole('region', { name: 'Resumen del cheque' });
    expect(within(card).getByText('Monto del cheque')).toBeInTheDocument();
    expect(await within(card).findByRole('alert')).toHaveTextContent(/.+/);
  });
  it('la Jefa de Cuentas confirma la acreditación de un cheque depositado con el panel de envíos', async () => {
    mocks.get.mockResolvedValue(deposited);
    const onClose = vi.fn();
    mount(onClose);
    const confirm = await screen.findByRole('button', { name: 'Confirmar acreditación' });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    expect(await screen.findByText('Confirmar depósito bancario')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar depósito' }));
    expect(await screen.findByText('Adjunta el comprobante bancario.')).toBeInTheDocument();
    await userEvent.upload(screen.getByLabelText(/Comprobante bancario/), new File(['proof'], 'banco.pdf', { type: 'application/pdf' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar depósito' }));
    await waitFor(() => expect(mocks.confirmDeposit).toHaveBeenCalledWith(9, 'https://example.com/deposito'));
    expect(mocks.upload).toHaveBeenCalledWith(expect.objectContaining({ operationId: 5 }));
    expect(onClose).toHaveBeenCalled();
    expect(mocks.command).not.toHaveBeenCalled();
  });
  it('rechazar regresa al panel del cheque si se cancela', async () => {
    mocks.get.mockResolvedValue(deposited); mount();
    const reject = await screen.findByRole('button', { name: 'Rechazar' });
    await waitFor(() => expect(reject).toBeEnabled());
    fireEvent.click(reject);
    expect(await screen.findByLabelText('Motivo del rechazo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByRole('button', { name: 'Confirmar acreditación' })).toBeInTheDocument();
  });
  it('la Jefa de Cajas solo ve quién confirma un cheque depositado', async () => {
    mocks.role = 'JEFA_CAJAS'; mocks.get.mockResolvedValue(deposited); mount();
    expect(await screen.findByText(/La Jefa de Cuentas confirma la acreditación/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar acreditación' })).not.toBeInTheDocument();
    expect(mocks.pendingDeposits).not.toHaveBeenCalled();
  });
});
