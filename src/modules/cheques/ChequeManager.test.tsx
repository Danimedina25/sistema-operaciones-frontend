import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChequeManager } from './ChequeManager';
import type { Cheque } from './types';
const mocks = vi.hoisted(() => ({ command: vi.fn(), get: vi.fn(), upload: vi.fn(), accounts: vi.fn(), role: 'JEFA_CUENTAS' }));
vi.mock('./api', () => ({ chequesApi: { byPayment: mocks.get, command: mocks.command } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 }, hasRole: (roles: string[]) => roles.includes(mocks.role) }) }));
vi.mock('@/modules/operations/api/operations-storage.api', () => ({ uploadOperationProof: mocks.upload }));
vi.mock('@/modules/bank-accounts/api/bank-accounts.api', () => ({ getBankAccounts: mocks.accounts }));
const cheque: Cheque = { id: 3, pagoId: 4, operacionId: 5, clienteNombre: 'Cliente', numeroCheque: '123', bancoEmisor: 'Banco', emisor: 'Emisor', beneficiario: 'Empresa', monto: 100, moneda: 'MXN', estado: 'POR_COBRAR', requiereConciliacion: false, version: 1, fechaRecepcion: '2026-09-20', cuentaDestinoId: null, cuentaDestinoEtiqueta: null, destinoCobro: null, comprobanteUrl: 'https://example.com/cheque', historial: [] };
function mount() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter><ChequeManager paymentId={4} onClose={vi.fn()} /></MemoryRouter></QueryClientProvider>); }
beforeEach(() => { vi.clearAllMocks(); mocks.role = 'JEFA_CUENTAS'; mocks.get.mockResolvedValue(cheque); mocks.upload.mockResolvedValue({ downloadUrl: 'https://example.com/deposito' }); mocks.accounts.mockResolvedValue([{ id: 8, banco: 'Bajío', titular: 'Empresa', numeroCuenta: '123456', activo: true }]); });
describe('shared cheque manager', () => {
  it('sends a deposit command and preserves its idempotency key on an uncertain retry', async () => {
    mocks.command.mockRejectedValueOnce(new Error('Respuesta incierta')).mockResolvedValueOnce({ ...cheque, estado: 'DEPOSITADO', version: 2 });
    mount();
    fireEvent.change(await screen.findByLabelText(/Acción/), { target: { value: 'DEPOSITAR' } });
    fireEvent.change(screen.getByLabelText(/Fecha efectiva/), { target: { value: '2026-09-20' } });
    await screen.findByRole('option', { name: /Empresa — Bajío/ });
    fireEvent.change(screen.getByLabelText('Cuenta bancaria'), { target: { value: '8' } });
    await userEvent.upload(screen.getByLabelText(/Comprobante/), new File(['proof'], 'proof.pdf', { type: 'application/pdf' }));
    const form = screen.getByRole('button', { name: 'Confirmar acción' }).closest('form')!;
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
  it('lets the head of accounts assign cash collection without recognizing money', async () => {
    mocks.command.mockResolvedValue({ ...cheque, estado: 'PENDIENTE_COBRO_EFECTIVO', version: 2 });
    mount(); await screen.findByLabelText(/Acción/);
    expect(screen.queryByRole('option', { name: 'Confirmar efectivo recibido' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Acción/), { target: { value: 'ASIGNAR_COBRO_EFECTIVO' } });
    fireEvent.change(screen.getByLabelText(/Fecha efectiva/), { target: { value: '2026-09-20' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Confirmar acción' }).closest('form')!);
    await waitFor(() => expect(mocks.command).toHaveBeenCalledTimes(1));
    expect(mocks.command.mock.calls[0][1]).toMatchObject({ accion: 'ASIGNAR_COBRO_EFECTIVO', version: 1 });
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
