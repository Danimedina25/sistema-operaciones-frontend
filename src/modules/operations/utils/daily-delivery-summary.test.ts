import { describe, expect, it } from 'vitest';
import {
  computeDailyDeliverySummary,
  type DeliveryLike,
} from './daily-delivery-summary';

function buildDelivery(
  overrides: Partial<DeliveryLike> & {
    id?: number;
    fechaHoraRecoleccionEfectivo?: string;
  },
): DeliveryLike {
  const { id: _id, fechaHoraRecoleccionEfectivo, ...rest } = overrides;
  void _id;
  return {
    monto: 100,
    estatus: 'EN_RECOLECCION',
    scheduledAt: fechaHoraRecoleccionEfectivo ?? null,
    ...rest,
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

  describe('confirmación parcial de parcialidades (cerradoPorJefa)', () => {
    it('cuenta como entregado cuando la jefa ya cerró aunque falte el socio', () => {
      const summary = computeDailyDeliverySummary([
        buildDelivery({ id: 1, monto: 100, estatus: 'ENTREGADA', cerradoPorJefa: true }),
      ]);

      expect(summary.totalDelivered).toBe(100);
      expect(summary.totalPending).toBe(0);
      expect(summary.pendingConfirmationCount).toBe(0);
    });

    it('sigue pendiente cuando solo confirmó el socio', () => {
      const summary = computeDailyDeliverySummary([
        buildDelivery({ id: 1, monto: 100, estatus: 'ENTREGADA', cerradoPorJefa: false }),
      ]);

      expect(summary.totalDelivered).toBe(0);
      expect(summary.totalPending).toBe(100);
      expect(summary.pendingConfirmationCount).toBe(1);
    });

    it('el flujo legacy (ENTREGADO sin cerradoPorJefa) mantiene el comportamiento previo', () => {
      const summary = computeDailyDeliverySummary([
        buildDelivery({ id: 1, monto: 100, estatus: 'ENTREGADO' }),
      ]);

      expect(summary.totalDelivered).toBe(100);
      expect(summary.pendingConfirmationCount).toBe(1);
    });
  });
});
