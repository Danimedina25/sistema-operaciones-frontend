import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { OperationDetailCard } from './OperationDetailCard';
import type { PaymentOperationResponse } from '../types/operations.types.ts';

const roles = vi.hoisted(() => ({ current: ['JEFA_CUENTAS'] as string[] }));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ hasRole: (candidate: string[]) => candidate.some((role) => roles.current.includes(role)) }),
}));
vi.mock('../hooks/use-mark-operations-as-invoiced.js', () => ({
  useMarkOperationAsInvoiced: () => ({ processingOperationId: null, submitMarkAsInvoiced: vi.fn() }),
}));
vi.mock('@/shared/hooks/use-whatsapp-link', () => ({
  useWhatsAppLink: () => ({ openWhatsApp: vi.fn() }),
}));

const operation = {
  id: 40,
  clienteNombre: 'Cliente prueba',
  socioComercialNombre: 'Socio prueba',
  createdAt: '2026-09-20T10:00:00',
  updatedAt: '2026-09-20T10:00:00',
  estatus: 'RETORNO_PARCIAL_ENTREGADO',
  pagos: [],
  montoTotal: 300000,
  montoValidado: 300000,
  saldoPendientePorValidar: 0,
  montoTotalDevolverCliente: 291900,
  saldoPendienteRetornar: 91900,
  saldoPendientePorRegistrar: 0,
  saldoPendientePorSolicitar: 0,
} as unknown as PaymentOperationResponse;

it('muestra a Cuentas el saldo por validar del backend, incluso si es cero, antes del retorno', () => {
  roles.current = ['JEFA_CUENTAS'];
  render(<MemoryRouter><OperationDetailCard operation={operation} canViewFinancialDetails={false} canViewOperationExtras={false} /></MemoryRouter>);
  const pending = screen.getByText('Pendiente por validar');
  expect(pending.parentElement).toHaveTextContent('$0.00');
  expect(pending.compareDocumentPosition(screen.getByText('Retorno al cliente')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText('Retorno al cliente').parentElement).toHaveTextContent('$291,900.00');
});

it('conserva para el Socio el saldo pendiente por retornar de la operación', () => {
  roles.current = ['SOCIO_COMERCIAL'];
  render(<MemoryRouter><OperationDetailCard operation={operation} canViewFinancialDetails={false} canViewOperationExtras={false} /></MemoryRouter>);
  const pending = screen.getAllByText('Pendiente por retornar')[0];
  expect(pending.closest('div.rounded-xl')).toHaveTextContent('$91,900.00');
});

it('muestra al Socio el saldo por solicitar que entrega la API cuando aún no hay solicitudes', () => {
  roles.current = ['SOCIO_COMERCIAL'];
  render(<MemoryRouter><OperationDetailCard operation={{ ...operation, saldoPendientePorSolicitar: 121875 }} canViewFinancialDetails={false} canViewOperationExtras={false} /></MemoryRouter>);
  expect(screen.getByText('Por solicitar').closest('div.rounded-xl')).toHaveTextContent('$121,875.00');
});
