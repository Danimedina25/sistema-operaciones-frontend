import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type { OperationPaymentResponse } from '../types/operations.types.ts';
import { PaymentsTable } from './PaymentsTable';

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({
    user: { userId: 28, roles: ['JEFA_CUENTAS'] },
    hasRole: (roles: string[]) => roles.includes('JEFA_CUENTAS'),
  }),
}));

vi.mock('@/modules/cheques/ChequeManager', () => ({
  ChequeManager: ({ paymentId }: { paymentId: number }) => <div role="dialog">Cheque #{paymentId}</div>,
}));

function payment(overrides: Partial<OperationPaymentResponse> = {}): OperationPaymentResponse {
  return {
    id: 70, monto: 75, tipoPago: 'CHEQUE', chequeEstado: 'POR_COBRAR',
    comprobanteUrl: 'https://example.test/comprobante.pdf', comprobanteValidacionUrl: '',
    cuentaDestinoId: null, cuentaDestinoBanco: '', cuentaDestinoTitular: '',
    estatus: 'PENDIENTE_VALIDACION', observaciones: null,
    registradoPorId: 27, registradoPorNombre: 'Socio de prueba',
    validadoPorId: null, validadoPorNombre: null,
    enProcesoPorId: null, enProcesoPorNombre: null, fechaEnProceso: null,
    fechaPago: '2026-10-15T10:00:00', fechaValidacion: null,
    fechaComprobante: '2026-10-15T10:00:00',
    createdAt: '2026-10-15T10:00:00', updatedAt: '2026-10-15T10:00:00',
    ...overrides,
  };
}

function mount(payments: OperationPaymentResponse[], socioComercialTelefono?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter>
    <PaymentsTable payments={payments} operationId={45} socioComercialTelefono={socioComercialTelefono} />
  </MemoryRouter></QueryClientProvider>);
}

describe('Cheques en el detalle para Jefa de Cuentas', () => {
  it('no ofrece Revisar en un cheque que Cajas ya cobró y deja visible solo el aviso', () => {
    mount([payment({ chequeEstado: 'COBRADO', estatus: 'VALIDADA' })], '9991234567');

    expect(screen.queryByRole('button', { name: 'Revisar' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Avisar por WhatsApp/ }).length).toBeGreaterThan(0);
  });

  it('ofrece Revisar cuando el cheque espera acreditación', () => {
    mount([payment({ chequeEstado: 'DEPOSITADO' })]);

    fireEvent.click(screen.getAllByRole('button', { name: 'Revisar' })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('Cheque #70');
  });

  it('no deja a Cuentas decidir el destino de un cheque recién recibido', () => {
    mount([payment()]);

    expect(screen.queryByRole('button', { name: 'Revisar' })).not.toBeInTheDocument();
  });
});
