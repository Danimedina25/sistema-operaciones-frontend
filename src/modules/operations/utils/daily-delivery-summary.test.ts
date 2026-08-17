import { describe, expect, it } from 'vitest';
import { computeDailyDeliverySummary } from './daily-delivery-summary';
import type { ReturnPaymentResponse } from '@/modules/operations/types/operations.types.ts';

function buildDelivery(overrides: Partial<ReturnPaymentResponse>): ReturnPaymentResponse {
  return {
    id: 1,
    operationId: 1,
    clientId: 1,
    monto: 100,
    tipoPago: 'EFECTIVO',
    estatus: 'EN_RECOLECCION',
    fechaSolicitud: '2026-01-10T08:00:00.000Z',
    createdAt: '2026-01-10T08:00:00.000Z',
    ...overrides,
  };
}

describe('computeDailyDeliverySummary', () => {
  it('devuelve ceros y next pickup null para una lista vacía', () => {
    const summary = computeDailyDeliverySummary([]);

    expect(summary).toEqual({
      totalDelivered: 0,
      totalPending: 0,
      deliveriesCount: 0,
      nextPickup: null,
      pendingConfirmationCount: 0,
    });
  });

  it('suma el monto entregado (ENTREGADO/RETORNADO) y pendiente (SOLICITADO/EN_RECOLECCION) por separado', () => {
    const summary = computeDailyDeliverySummary([
      buildDelivery({ id: 1, monto: 100, estatus: 'ENTREGADO' }),
      buildDelivery({ id: 2, monto: 50, estatus: 'RETORNADO' }),
      buildDelivery({ id: 3, monto: 30, estatus: 'SOLICITADO' }),
      buildDelivery({ id: 4, monto: 20, estatus: 'EN_RECOLECCION', fechaHoraRecoleccionEfectivo: '2026-01-10T15:00:00.000Z' }),
    ]);

    expect(summary.totalDelivered).toBe(150);
    expect(summary.totalPending).toBe(50);
    expect(summary.deliveriesCount).toBe(4);
  });

  it('cuenta como pendientes de confirmación solo las ENTREGADO', () => {
    const summary = computeDailyDeliverySummary([
      buildDelivery({ id: 1, estatus: 'ENTREGADO' }),
      buildDelivery({ id: 2, estatus: 'ENTREGADO' }),
      buildDelivery({ id: 3, estatus: 'RETORNADO' }),
      buildDelivery({ id: 4, estatus: 'EN_RECOLECCION', fechaHoraRecoleccionEfectivo: '2026-01-10T15:00:00.000Z' }),
    ]);

    expect(summary.pendingConfirmationCount).toBe(2);
  });

  it('encuentra la próxima recolección como la fecha EN_RECOLECCION más próxima', () => {
    const summary = computeDailyDeliverySummary([
      buildDelivery({ id: 1, estatus: 'EN_RECOLECCION', fechaHoraRecoleccionEfectivo: '2026-01-10T18:00:00.000Z' }),
      buildDelivery({ id: 2, estatus: 'EN_RECOLECCION', fechaHoraRecoleccionEfectivo: '2026-01-10T12:00:00.000Z' }),
      buildDelivery({ id: 3, estatus: 'EN_RECOLECCION', fechaHoraRecoleccionEfectivo: '2026-01-10T15:00:00.000Z' }),
    ]);

    expect(summary.nextPickup).toBe('2026-01-10T12:00:00.000Z');
  });

  it('ignora entregas ya completadas al buscar la próxima recolección', () => {
    const summary = computeDailyDeliverySummary([
      buildDelivery({ id: 1, estatus: 'RETORNADO', fechaHoraRecoleccionEfectivo: '2026-01-10T08:00:00.000Z' }),
      buildDelivery({ id: 2, estatus: 'EN_RECOLECCION', fechaHoraRecoleccionEfectivo: '2026-01-10T16:00:00.000Z' }),
    ]);

    expect(summary.nextPickup).toBe('2026-01-10T16:00:00.000Z');
  });
});
