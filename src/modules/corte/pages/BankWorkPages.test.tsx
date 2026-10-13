import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BankIncomePage from './BankIncomePage';
import BankOutflowPage from './BankOutflowPage';

const income = vi.fn();
const outflow = vi.fn();
let roles: string[] = ['JEFA_CUENTAS'];
vi.mock('../api/bank-work.api', () => ({ bankWorkApi: { income: (...args: unknown[]) => income(...args), outflow: (...args: unknown[]) => outflow(...args) } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: (allowed: string[]) => allowed.some(role => roles.includes(role)) }) }));
vi.mock('@/modules/cheques/ChequeManager', () => ({ ChequeManager: () => null }));

function mount(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/cuentas/entradas" element={<BankIncomePage />} />
    <Route path="/cuentas/salidas" element={<BankOutflowPage />} />
  </Routes></MemoryRouter></QueryClientProvider>);
}

describe('Colas bancarias', () => {
  beforeEach(() => {
    roles = ['JEFA_CUENTAS'];
    income.mockReset().mockResolvedValue({ content: [
      { id: 1, operationId: 42, clienteNombre: 'Cliente Uno', socioComercialNombre: 'Socio A', monto: 100, tipoPago: 'TRANSFERENCIA', estatus: 'PENDIENTE_VALIDACION', cuentaDestino: 'BBVA', fechaPago: '2026-10-01T10:00:00' },
      { id: 2, operationId: 42, clienteNombre: 'Cliente Uno', socioComercialNombre: 'Socio A', monto: 200, tipoPago: 'DEPOSITO', estatus: 'EN_PROCESO', cuentaDestino: 'BANORTE', fechaPago: '2026-10-02T10:00:00' },
    ], totalElements: 2, totalPages: 1, totalAmount: 300 });
    outflow.mockReset().mockResolvedValue({ content: [
      { id: 8, operationId: 42, clienteNombre: 'Cliente Uno', cuentaDestinoTitular: 'Beneficiario A', montoDisponible: 50, montoSolicitado: 100, montoRetornado: 50, porcentajeAvance: 50 },
      { id: 9, operationId: 42, clienteNombre: 'Cliente Uno', cuentaDestinoTitular: 'Beneficiario B', montoDisponible: 75, montoSolicitado: 75, montoRetornado: 0, porcentajeAvance: 0 },
    ], totalElements: 2, totalPages: 1, totalAmount: 125 });
  });

  it('muestra una fila por pago bancario y permite quitar el filtro de método', async () => {
    mount('/cuentas/entradas');
    expect(await within(await screen.findByRole('table')).findAllByRole('row')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    fireEvent.change(screen.getByLabelText('Método de entrada bancaria'), { target: { value: 'DEPOSITO' } });
    expect(screen.getByRole('button', { name: 'Quitar filtro Depósito' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtro Depósito' }));
    expect(income).toHaveBeenLastCalledWith(0, '', '');
  });

  it('muestra una fila por solicitud y conserva la acción de pagar para Auxiliar', async () => {
    roles = ['AUXILIAR_CUENTAS'];
    mount('/cuentas/salidas');
    expect(await within(await screen.findByRole('table')).findAllByRole('row')).toHaveLength(3);
    expect(within(screen.getByRole('table')).getAllByRole('button', { name: 'Registrar retorno' })).toHaveLength(2);
  });

  it('mantiene la consulta sin acciones para Gerente', async () => {
    roles = ['GERENTE'];
    mount('/cuentas/salidas');
    await screen.findByRole('table');
    expect(screen.queryByRole('button', { name: 'Registrar retorno' })).toBeNull();
    expect(screen.getAllByRole('link', { name: /Ver operación/ })).toHaveLength(4);
  });
});
