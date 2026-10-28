import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
vi.mock('@/modules/caja-general/api/caja-general.api', () => ({ cajaGeneralApi: { latest: vi.fn().mockResolvedValue({ id: 1, fecha: '2026-09-20', closedAt: null }) } }));
const cheque: Cheque = { id: 3, pagoId: 4, operacionId: 5, clienteNombre: 'Cliente', numeroCheque: '123', bancoEmisor: 'Banco', emisor: 'Emisor', beneficiario: 'Empresa', monto: 100, moneda: 'MXN', estado: 'POR_COBRAR', requiereConciliacion: false, version: 1, fechaRecepcion: '2026-09-20', cuentaDestinoId: null, cuentaDestinoEtiqueta: null, destinoCobro: null, comprobanteUrl: 'https://example.com/cheque', historial: [] };
function mount() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter><ChequeManager paymentId={4} onClose={vi.fn()} /></MemoryRouter></QueryClientProvider>); }
beforeEach(() => { vi.clearAllMocks(); mocks.role = 'JEFA_CUENTAS'; mocks.get.mockResolvedValue(cheque); mocks.upload.mockResolvedValue({ downloadUrl: 'https://example.com/deposito' }); mocks.accounts.mockResolvedValue([{ id: 8, banco: 'Bajío', titular: 'Empresa', numeroCuenta: '123456', activo: true }]); });
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
});
