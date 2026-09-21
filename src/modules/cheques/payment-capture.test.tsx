import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddOperationPaymentForm } from '@/modules/operations/components/AddOperationPaymentForm';
import { useAddOperationPayment } from '@/modules/operations/hooks/use-add-operation-payment';
const mocks = vi.hoisted(() => ({ add: vi.fn().mockResolvedValue({ id: 1 }), upload: vi.fn().mockResolvedValue({ downloadUrl: 'proof-url' }) }));
vi.mock('@/modules/operations/api/operations.api', () => ({ addOperationPayment: mocks.add }));
vi.mock('@/modules/operations/api/operations-storage.api', () => ({ uploadOperationProof: mocks.upload }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 } }) }));
describe('payment capture integration', () => {
  it('hides the destination account when switching from transfer to cheque', () => {
    render(<AddOperationPaymentForm isSubmitting={false} bankAccounts={[]} montoTotal={100} montoRegistrado={0} saldoPendiente={100} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TRANSFERENCIA' } });
    expect(screen.getByPlaceholderText('Buscar cuenta...')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CHEQUE' } });
    expect(screen.queryByPlaceholderText('Buscar cuenta...')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Número de cheque')).toBeInTheDocument();
  });
  it('sends null for cheque destination even when stale form data contains an account', async () => {
    const { result } = renderHook(() => useAddOperationPayment());
    const proof = new File(['proof'], 'proof.pdf', { type: 'application/pdf' });
    await act(async () => result.current.submitAddOperationPayment(3, {
      monto: '100', tipoPago: 'CHEQUE', cuentaDestinoId: '99', fechaComprobante: '2026-09-20',
      numeroCheque: '123', bancoEmisor: 'Banco', emisor: 'Cliente', beneficiario: 'Empresa',
      comprobante: { item: () => proof } as unknown as FileList,
    }));
    expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ operacionId: 3, tipoPago: 'CHEQUE', cuentaDestinoId: null, numeroCheque: '123' }));
  });
});
