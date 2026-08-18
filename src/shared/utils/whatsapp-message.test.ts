import { describe, expect, it } from 'vitest';
import {
  buildCommissionPaidMessage,
  buildDeliveryNoticeMessage,
  buildOperationShareMessage,
  buildPaymentRejectedMessage,
  buildPaymentValidatedMessage,
  buildReturnPaidMessage,
} from './whatsapp-message';

describe('buildOperationShareMessage', () => {
  it('incluye folio, cliente, monto y estado', () => {
    const message = buildOperationShareMessage({
      operationId: 42,
      clienteNombre: 'Cliente Demo',
      montoTotal: 1000,
      estatusLabel: 'Validada',
    });

    expect(message).toContain('Operación #42');
    expect(message).toContain('Cliente Demo');
    expect(message).toContain('Estado: Validada');
    expect(message).toContain('$1,000.00');
  });

  it('incluye el saldo pendiente cuando se provee', () => {
    const message = buildOperationShareMessage({
      operationId: 1,
      clienteNombre: 'Cliente',
      montoTotal: 100,
      estatusLabel: 'Pendiente',
      saldoPendienteLabel: 'Saldo pendiente por validar: $50.00',
    });

    expect(message).toContain('Saldo pendiente por validar: $50.00');
  });

  it('omite el saldo pendiente y la URL cuando no se proveen', () => {
    const message = buildOperationShareMessage({
      operationId: 1,
      clienteNombre: 'Cliente',
      montoTotal: 100,
      estatusLabel: 'Pendiente',
    });

    expect(message.split('\n')).toHaveLength(4);
  });

  it('nunca incluye datos bancarios, CLABE ni comprobantes', () => {
    const message = buildOperationShareMessage({
      operationId: 1,
      clienteNombre: 'Cliente',
      montoTotal: 100,
      estatusLabel: 'Pendiente',
      publicUrl: 'https://app.example.com/operaciones/1',
    });

    expect(message.toLowerCase()).not.toContain('clabe');
    expect(message.toLowerCase()).not.toContain('cuenta');
    expect(message.toLowerCase()).not.toContain('comprobante');
  });
});

describe('buildDeliveryNoticeMessage', () => {
  it('incluye folio, fecha, tipo e instrucción sin datos bancarios', () => {
    const message = buildDeliveryNoticeMessage({
      operationId: 7,
      scheduledAtLabel: '10 de enero de 2026, 10:00 a. m.',
      deliveryTypeLabel: 'Efectivo',
    });

    expect(message).toContain('Folio: #7');
    expect(message).toContain('10 de enero de 2026, 10:00 a. m.');
    expect(message).toContain('Tipo de entrega: Efectivo');
    expect(message.toLowerCase()).not.toContain('clabe');
    expect(message.toLowerCase()).not.toContain('cuenta');
  });
});

describe('buildPaymentValidatedMessage', () => {
  it('incluye folio y monto, y la URL cuando se provee', () => {
    const message = buildPaymentValidatedMessage({
      operationId: 42,
      monto: 1500,
      publicUrl: 'https://app.example.com/operaciones/42',
    });

    expect(message).toContain('#42');
    expect(message).toContain('$1,500.00');
    expect(message).toContain('validado');
    expect(message).toContain('https://app.example.com/operaciones/42');
  });

  it('omite la URL cuando no se provee', () => {
    const message = buildPaymentValidatedMessage({
      operationId: 1,
      monto: 100,
    });

    expect(message.split('\n')).toHaveLength(1);
  });

  it('nunca incluye datos bancarios ni CLABE', () => {
    const message = buildPaymentValidatedMessage({ operationId: 1, monto: 100 });

    expect(message.toLowerCase()).not.toContain('clabe');
    expect(message.toLowerCase()).not.toContain('cuenta bancaria');
  });
});

describe('buildPaymentRejectedMessage', () => {
  it('incluye folio, monto y motivo cuando se provee', () => {
    const message = buildPaymentRejectedMessage({
      operationId: 7,
      monto: 250,
      motivo: 'Comprobante ilegible',
      publicUrl: 'https://app.example.com/operaciones/7',
    });

    expect(message).toContain('#7');
    expect(message).toContain('$250.00');
    expect(message).toContain('rechazado');
    expect(message).toContain('Motivo: Comprobante ilegible');
    expect(message).toContain('https://app.example.com/operaciones/7');
  });

  it('omite la línea de motivo cuando no se provee', () => {
    const message = buildPaymentRejectedMessage({ operationId: 1, monto: 100 });

    expect(message).not.toContain('Motivo:');
  });
});

describe('buildReturnPaidMessage', () => {
  it('incluye folio, monto y la URL cuando se provee', () => {
    const message = buildReturnPaidMessage({
      operationId: 13,
      monto: 800,
      publicUrl: 'https://app.example.com/operaciones/13',
    });

    expect(message).toContain('#13');
    expect(message).toContain('$800.00');
    expect(message).toContain('https://app.example.com/operaciones/13');
  });

  it('nunca incluye datos bancarios ni CLABE', () => {
    const message = buildReturnPaidMessage({ operationId: 1, monto: 100 });

    expect(message.toLowerCase()).not.toContain('clabe');
    expect(message.toLowerCase()).not.toContain('cuenta bancaria');
  });
});

describe('buildCommissionPaidMessage', () => {
  it('incluye el monto y la URL cuando se provee', () => {
    const message = buildCommissionPaidMessage({
      monto: 300,
      publicUrl: 'https://app.example.com/mis-comisiones',
    });

    expect(message).toContain('$300.00');
    expect(message).toContain('https://app.example.com/mis-comisiones');
  });

  it('omite la URL cuando no se provee', () => {
    const message = buildCommissionPaidMessage({ monto: 100 });

    expect(message.split('\n')).toHaveLength(1);
  });
});
