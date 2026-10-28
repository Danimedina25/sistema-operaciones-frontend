import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type { OperationPaymentResponse } from '../types/operations.types.ts';
import { PaymentsTable } from './PaymentsTable';

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({
    user: { userId: 28, roles: ['JEFA_CAJAS'] },
    hasRole: (roles: string[]) => roles.includes('JEFA_CAJAS'),
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

describe('Cheques en el detalle para Jefa de Cajas', () => {
  it('muestra el cheque por cobrar y abre su gestor desde Revisar', () => {
    mount([payment()]);

    expect(screen.queryByText('Sin comprobantes de tu tipo')).not.toBeInTheDocument();
    expect(screen.getAllByText('Cheque').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Revisar' })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('Cheque #70');
  });

  it('permite consultar un cheque depositado sin ofrecer una nueva validación', () => {
    mount([payment({ chequeEstado: 'DEPOSITADO' })]);

    expect(screen.getAllByText('Cheque').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Revisar' })).not.toBeInTheDocument();
  });

  it('avisa por WhatsApp al socio cuando el cheque ya quedó validado', () => {
    mount([payment({ chequeEstado: 'COBRADO', estatus: 'VALIDADA' })], '9991234567');

    expect(screen.getAllByRole('button', { name: /Avisar por WhatsApp/ }).length).toBeGreaterThan(0);
  });

  it('no ofrece el aviso mientras el cheque sigue pendiente', () => {
    mount([payment({ chequeEstado: 'DEPOSITADO' })], '9991234567');

    expect(screen.queryByRole('button', { name: /Avisar por WhatsApp/ })).not.toBeInTheDocument();
  });

  it('mantiene fuera los pagos bancarios ajenos a Cajas', () => {
    mount([payment({ tipoPago: 'TRANSFERENCIA', chequeEstado: null })]);

    expect(screen.getByText('Sin comprobantes de tu tipo')).toBeInTheDocument();
  });
});
