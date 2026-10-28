import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { PayBeneficiaryCommissionsModal } from './PayBeneficiaryCommissionsModal';
import type { CommissionPartnerSummaryResponse } from '../types/commercial-partner-commissions.types';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: { operations: [
      { commissionId: 7, operationId: 43, clienteNombre: 'Cliente pendiente', operationAmount: 1000, commissionPercentage: 1, commissionAmount: 10 },
      { commissionId: 8, operationId: 44, clienteNombre: 'Ya pagado', operationAmount: 2000, commissionPercentage: 1, commissionAmount: 20 },
    ] },
    isPending: false,
    error: null,
  }),
}));
vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({
  useBankAccounts: () => ({ accounts: [{ id: 126, banco: 'BANORTE', numeroCuenta: '12348998' }], isLoading: false }),
}));
vi.mock('@/shared/components/ui/ActionDrawer', () => ({
  ActionDrawer: ({ children, footer, title }: { children: React.ReactNode; footer: React.ReactNode; title: string }) =>
    <div role="dialog" aria-label={title}>{children}{footer}</div>,
}));
vi.mock('@/shared/components/ui/BankAccountCombobox', () => ({
  BankAccountCombobox: ({ onChange, fieldError }: { onChange: (id: number) => void; fieldError: string }) =>
    <div><button onClick={() => onChange(126)}>Elegir BANORTE</button>{fieldError && <p role="alert">{fieldError}</p>}</div>,
}));
vi.mock('@/shared/components/ui/ReceiptUploadField', () => ({
  ReceiptUploadField: ({ onChange }: { onChange: (file: File) => void }) =>
    <button onClick={() => onChange(new File(['comprobante'], 'pago.pdf', { type: 'application/pdf' }))}>Adjuntar comprobante</button>,
}));

const beneficiary: CommissionPartnerSummaryResponse = {
  beneficiaryId: 2, beneficiaryType: 'COMMERCIAL_PARTNER', nombre: 'Socio de prueba',
  banco: 'ALBO', cuentaBancaria: '12341111', titularCuenta: 'Socio de prueba', telefono: null,
  totalOperaciones: 1, montoOperado: 1000, totalComisiones: 10, totalPendientes: 10,
  totalPagadas: 0, fechaPagada: '', totalComisionesPendientes: 1,
  commissionIdsToPay: [7], paymentProofUrl: null, estatus: 'PENDIENTE',
};

it('paga solo comisiones pendientes con comprobante y cuenta origen elegida', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<PayBeneficiaryCommissionsModal open beneficiary={beneficiary} startDate="2026-10-01" endDate="2026-10-14" onClose={vi.fn()} onSubmit={onSubmit} />);
  const user = userEvent.setup();
  expect(screen.getByRole('dialog')).toHaveTextContent('Cliente pendiente');
  expect(screen.getByRole('dialog')).not.toHaveTextContent('Ya pagado');
  expect(screen.getByRole('dialog')).toHaveTextContent('$10.00');

  await user.click(screen.getByRole('button', { name: 'Adjuntar comprobante' }));
  await user.click(screen.getByRole('button', { name: 'Registrar pago' }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent('Selecciona la cuenta');

  await user.click(screen.getByRole('button', { name: 'Elegir BANORTE' }));
  await user.click(screen.getByRole('button', { name: 'Registrar pago' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'pago.pdf' }), 126);
});

it('conserva el comprobante cuando falla el pago y permite reintentar', async () => {
  const onSubmit = vi.fn().mockRejectedValueOnce(new Error('No fue posible registrar el pago')).mockResolvedValueOnce(undefined);
  render(<PayBeneficiaryCommissionsModal open beneficiary={beneficiary} startDate="2026-10-01" endDate="2026-10-14" onClose={vi.fn()} onSubmit={onSubmit} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Adjuntar comprobante' }));
  await user.click(screen.getByRole('button', { name: 'Elegir BANORTE' }));
  await user.click(screen.getByRole('button', { name: 'Registrar pago' }));
  expect(screen.getByRole('alert')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Registrar pago' }));
  expect(onSubmit).toHaveBeenCalledTimes(2);
  expect(onSubmit.mock.calls[1][0]).toBe(onSubmit.mock.calls[0][0]);
});

it('bloquea un segundo pago y cancelar mientras se registra', async () => {
  let finish!: () => void;
  const onSubmit = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  render(<PayBeneficiaryCommissionsModal open beneficiary={beneficiary} startDate="2026-10-01" endDate="2026-10-14" onClose={vi.fn()} onSubmit={onSubmit} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Adjuntar comprobante' }));
  await user.click(screen.getByRole('button', { name: 'Elegir BANORTE' }));
  await user.dblClick(screen.getByRole('button', { name: 'Registrar pago' }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  await import('@testing-library/react').then(({ act }) => act(async () => finish()));
});

it('muestra el total y los errores dentro del resumen fijo del pago', async () => {
  render(<PayBeneficiaryCommissionsModal open beneficiary={beneficiary} startDate="2026-10-01" endDate="2026-10-14" onClose={vi.fn()} onSubmit={vi.fn()} />);
  const user = userEvent.setup();
  const summary = screen.getByRole('region', { name: 'Resumen del pago' });
  expect(summary).toHaveTextContent('Comisiones por pagar');
  expect(summary).toHaveTextContent('$10.00');
  expect(summary).toHaveTextContent('1 operación');
  await user.click(screen.getByRole('button', { name: 'Adjuntar comprobante' }));
  await user.click(screen.getByRole('button', { name: 'Registrar pago' }));
  expect(within(summary).getByRole('alert')).toHaveTextContent('Selecciona la cuenta desde la que se transfiere.');
});
