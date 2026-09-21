import { describe, expect, it } from 'vitest';
import { createOperationSchema } from '@/modules/operations/schemas/create-operation.schema';
import { updateOperationPaymentSchema } from '@/modules/operations/schemas/update-operation-payment.schema';
const payment = { monto: '100', tipoPago: 'CHEQUE', cuentaDestinoId: '', numeroCheque: '123', bancoEmisor: 'Banco', emisor: 'Cliente', beneficiario: 'Empresa', fechaComprobante: '2026-09-20', comprobante: new File(['proof'], 'cheque.jpg', { type: 'image/jpeg' }) };
const operation = { socioComercialId: 1, clienteId: 1, montoTotal: 100, nivelesRedComercial: 1, porcentajeComisionOficina: 0, porcentajeComisionSocio: 0, pagos: [payment] };
describe('cheque capture', () => {
  it('accepts a new cheque with no destination bank account', () => {
    expect(createOperationSchema.safeParse(operation).success).toBe(true);
  });
  it('accepts editing a cheque with null account instead of zero', () => {
    const result = updateOperationPaymentSchema.parse(payment);
    expect(result.cuentaDestinoId).toBeNull();
  });
  it.each(['TRANSFERENCIA', 'DEPOSITO'])('still requires a bank account for %s', tipoPago => {
    expect(createOperationSchema.safeParse({ ...operation, pagos: [{ ...payment, tipoPago }] }).success).toBe(false);
    expect(updateOperationPaymentSchema.safeParse({ ...payment, tipoPago }).success).toBe(false);
  });
  it('requires identification of the cheque', () => {
    expect(createOperationSchema.safeParse({ ...operation, pagos: [{ ...payment, numeroCheque: ' ' }] }).success).toBe(false);
    expect(updateOperationPaymentSchema.safeParse({ ...payment, numeroCheque: '' }).success).toBe(false);
  });
});
