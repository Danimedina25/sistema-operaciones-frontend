import { describe, expect, it } from 'vitest';
import { buildDeliveryNoticeMessage, buildOperationShareMessage } from './whatsapp-message';

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
