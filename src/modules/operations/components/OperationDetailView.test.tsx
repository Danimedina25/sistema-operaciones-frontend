import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { OperationDetailView } from './OperationDetailView';
import type { PaymentOperationResponse, ReturnPaymentResponse } from '../types/operations.types.ts';

const auth = vi.hoisted(() => ({ user: { userId: 27, roles: ['SOCIO_COMERCIAL'] } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => auth }));
vi.mock('./OperationDetailCard', () => ({ OperationDetailCard: () => null }));
vi.mock('./PaymentsTable', () => ({ PaymentsTable: ({ sectionTabs }: { sectionTabs: React.ReactNode }) => <>{sectionTabs}</> }));
vi.mock('./returns/ReturnPaymentsTable', () => ({ ReturnPaymentsTable: ({ sectionTabs }: { sectionTabs: React.ReactNode }) => <>{sectionTabs}</> }));

const operation = { id: 47, socioComercialId: 27, estatus: 'VALIDADA', pagos: [],
  saldoPendientePorRegistrar: 0, saldoPendientePorValidar: 0, saldoPendientePorSolicitar: 288000,
  saldoPendienteRetornar: 288000 } as unknown as PaymentOperationResponse;

beforeEach(() => { auth.user = { userId: 27, roles: ['SOCIO_COMERCIAL'] }; });

function show(overrides: Partial<PaymentOperationResponse> = {}, returns: ReturnPaymentResponse[] = [], allowed = true) {
  const capture = vi.fn();
  render(<OperationDetailView operation={{ ...operation, ...overrides }} returns={returns} onBack={vi.fn()}
    onAddPayment={vi.fn()} onAddRequestReturnPayment={capture} canRequestReturn={allowed}
    canViewFinancialDetails={false} canViewOperationExtras={false} />);
  return capture;
}

it('activa Retornos y abre la captura con el saldo del backend', () => {
  const capture = show();
  fireEvent.click(screen.getByRole('button', { name: 'Capturar retornos' }));
  expect(capture).toHaveBeenCalledExactlyOnceWith(operation, 288000);
  for (const tab of screen.getAllByRole('tab', { name: /Retornos/ })) {
    expect(tab).toHaveAttribute('aria-selected', 'true');
  }
});

it.each([
  { estatus: 'PENDIENTE_VALIDACION' }, { saldoPendientePorValidar: 1 },
  { saldoPendientePorRegistrar: 1 }, { saldoPendientePorSolicitar: 0 }, { socioComercialId: 99 },
] as Partial<PaymentOperationResponse>[])('oculta el botón cuando no cumple las condiciones: %j', overrides => {
  show(overrides);
  expect(screen.queryByRole('button', { name: 'Capturar retornos' })).not.toBeInTheDocument();
});

it('oculta el botón si ya hay retornos', () => {
  show({}, [{ id: 1 }] as ReturnPaymentResponse[]);
  expect(screen.queryByRole('button', { name: 'Capturar retornos' })).not.toBeInTheDocument();
});

it.each(['JEFA_CAJAS', 'JEFA_CUENTAS', 'GERENTE', 'DIRECCION', 'ADMIN'])('no ofrece el acceso flotante al rol %s', role => {
  auth.user.roles = [role];
  show();
  expect(screen.queryByRole('button', { name: 'Capturar retornos' })).not.toBeInTheDocument();
});

it('respeta el permiso de solicitar retornos', () => {
  show({}, [], false);
  expect(screen.queryByRole('button', { name: 'Capturar retornos' })).not.toBeInTheDocument();
});
