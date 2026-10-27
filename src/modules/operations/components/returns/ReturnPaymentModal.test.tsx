import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { ReturnPaymentResponse } from '../../types/operations.types.ts';
import { ReturnPaymentModal } from './ReturnPaymentModal';

const auth = vi.hoisted(() => ({ roles: ['JEFA_CAJAS'] }));
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => { auth.roles = ['JEFA_CAJAS']; });
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: auth }) }));
vi.mock('./CardlessCodePanel', () => ({ CardlessCodePanel: () => <div>Códigos de retiro para el cliente</div> }));
vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({ useBankAccounts: () => ({ accounts: [] }) }));
vi.mock('@/shared/components/ui/ActionDrawer', () => ({
  ActionDrawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ActionDrawerFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('./InstallmentHistoryTable', () => ({ InstallmentHistoryTable: () => null }));

it('mantiene el exceso visible en el resumen y lo retira al corregir el importe', () => {
  render(<ReturnPaymentModal open variant="manage" returnRequest={{ id: 37, operationId: 47, clientId: 1, monto: 120000, fechaSolicitud: '2026-10-17', createdAt: '2026-10-17', tipoPago: 'EFECTIVO',
    montoSolicitado: 120000, montoRetornado: 0, montoEnProceso: 0, montoPendiente: 120000, montoDisponible: 120000,
    estatus: 'SOLICITADO' } as ReturnPaymentResponse}
    installments={[]} canManageReturnPayments isSubmittingInstallment={false}
    onSubmitInstallment={vi.fn()} canConfirm={() => false} canDeliver={() => false} canCancel={() => false}
    onConfirm={vi.fn()} onDeliver={vi.fn()} onCancel={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Programar recolección' })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1000000' } });
  expect(screen.getByRole('button', { name: 'Programar recolección' })).toBeInTheDocument();
  const summary = screen.getByTestId('cash-collection-summary');
  expect(summary).toHaveClass('sticky', 'top-0');
  expect(within(summary).getByRole('alert')).toHaveTextContent('El importe no puede superar $120,000.00');
  expect(within(summary).getByRole('alert')).toHaveTextContent('Exceso: $880,000.00');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100000' } });
  expect(within(summary).queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Programar recolección parcial' })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '120000' } });
  expect(screen.getByRole('button', { name: 'Programar recolección total' })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '' } });
  expect(screen.getByRole('button', { name: 'Programar recolección' })).toBeInTheDocument();
});

for (const role of ['JEFA_CUENTAS', 'JEFA_CAJAS', 'AUXILIAR_CUENTAS']) {
  it(`respeta la etapa de asignación bancaria para ${role}`, () => {
    auth.roles = [role];
    render(<ReturnPaymentModal open variant="manage" returnRequest={{ id: 39, operationId: 47, tipoPago: 'RETIRO_SIN_TARJETA', monto: 300, montoDisponible: 300, montoSolicitado: 300, estatus: 'SOLICITADO' } as ReturnPaymentResponse}
      installments={[]} canManageReturnPayments isSubmittingInstallment={false} onSubmitInstallment={vi.fn()}
      canConfirm={() => false} canDeliver={() => false} canCancel={() => false} onConfirm={vi.fn()} onDeliver={vi.fn()} onCancel={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Códigos de retiro para el cliente')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('0.00')).not.toBeInTheDocument();
  });
}

it('reúne los errores en la card fija y retira el de evidencia al adjuntar el archivo', async () => {
  const submit = vi.fn();
  render(<ReturnPaymentModal open variant="manage" returnRequest={{ id: 43, operationId: 44, tipoPago: 'EFECTIVO', monto: 97.5, montoSolicitado: 97.5, montoDisponible: 97.5, montoRetornado: 0, montoEnProceso: 0, estatus: 'SOLICITADO' } as ReturnPaymentResponse}
    installments={[]} canManageReturnPayments isSubmittingInstallment={false} onSubmitInstallment={submit}
    canConfirm={() => false} canDeliver={() => false} canCancel={() => false} onConfirm={vi.fn()} onDeliver={vi.fn()} onCancel={vi.fn()} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Programar recolección' }));
  const summary = screen.getByTestId('cash-collection-summary');
  await waitFor(() => expect(within(summary).getAllByRole('alert')).toHaveLength(4));
  expect(within(summary).getByText('La evidencia del importe preparado es obligatoria')).toBeInTheDocument();
  expect(screen.getAllByText('La evidencia del importe preparado es obligatoria')).toHaveLength(1);
  expect(summary).toHaveClass('border-red-300');
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '97.50' } });
  await waitFor(() => expect(within(summary).queryByText('El importe debe ser mayor a 0')).not.toBeInTheDocument());
  vi.stubGlobal('DataTransfer', class {
    files: File[] = [];
    items = { add: (file: File) => this.files.push(file) };
  });
  const fileInput = document.querySelector('input[type="file"]')!;
  fireEvent.change(fileInput, { target: { files: [new File(['foto'], 'evidencia.png', { type: 'image/png' })] } });
  await waitFor(() => expect(within(summary).queryByText('La evidencia del importe preparado es obligatoria')).not.toBeInTheDocument());
  expect(submit).not.toHaveBeenCalled();
});

it('centraliza también los errores de retornos bancarios y ofrece cancelar en el pie', async () => {
  auth.roles = ['JEFA_CUENTAS'];
  const submit = vi.fn(), close = vi.fn();
  render(<ReturnPaymentModal open variant="manage" returnRequest={{ id: 38, operationId: 47, tipoPago: 'TRANSFERENCIA', monto: 100, montoSolicitado: 100, montoDisponible: 100, montoPendiente: 100, estatus: 'SOLICITADO' } as ReturnPaymentResponse}
    installments={[]} canManageReturnPayments isSubmittingInstallment={false} onSubmitInstallment={submit}
    canConfirm={() => false} canDeliver={() => false} canCancel={() => false} onConfirm={vi.fn()} onDeliver={vi.fn()} onCancel={vi.fn()} onClose={close} />);
  fireEvent.click(screen.getByRole('button', { name: 'Registrar retorno' }));
  const summary = screen.getByRole('region', { name: 'Resumen del retorno' });
  await waitFor(() => expect(within(summary).getByText('La cuenta origen es obligatoria')).toBeInTheDocument());
  expect(screen.getAllByText('La cuenta origen es obligatoria')).toHaveLength(1);
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(close).toHaveBeenCalledTimes(1);
});
