import { describe, expect, it } from 'vitest';
import { classifyDelivery } from './delivery-classification';

const now = new Date('2026-01-10T12:00:00.000Z');

describe('classifyDelivery', () => {
  it('clasifica como entregada cuando el socio confirmó (RETORNADO)', () => {
    expect(classifyDelivery({ estatus: 'RETORNADO' }, now)).toBe('DELIVERED');
  });

  it('clasifica como pendiente de confirmación del socio cuando ya se entregó físicamente (ENTREGADO)', () => {
    expect(classifyDelivery({ estatus: 'ENTREGADO' }, now)).toBe(
      'PENDING_PARTNER_CONFIRMATION',
    );
  });

  it('clasifica como sin programar si está SOLICITADO y no hay fecha de recolección', () => {
    expect(classifyDelivery({ estatus: 'SOLICITADO', scheduledAt: null }, now)).toBe(
      'UNSCHEDULED',
    );
  });

  it('clasifica como programada cuando falta más de 2 horas', () => {
    expect(
      classifyDelivery(
        { estatus: 'EN_RECOLECCION', scheduledAt: '2026-01-11T12:00:00.000Z' },
        now,
      ),
    ).toBe('SCHEDULED');
  });

  it('clasifica como próxima cuando faltan 2 horas o menos', () => {
    expect(
      classifyDelivery(
        { estatus: 'EN_RECOLECCION', scheduledAt: '2026-01-10T13:30:00.000Z' },
        now,
      ),
    ).toBe('UPCOMING');
  });

  it('clasifica como atrasada cuando la fecha programada ya pasó', () => {
    expect(
      classifyDelivery(
        { estatus: 'EN_RECOLECCION', scheduledAt: '2026-01-10T10:00:00.000Z' },
        now,
      ),
    ).toBe('LATE');
  });

  it('EN_RECOLECCION sin fecha programada se trata como sin programar', () => {
    expect(classifyDelivery({ estatus: 'EN_RECOLECCION', scheduledAt: null }, now)).toBe(
      'UNSCHEDULED',
    );
  });
});
