import { describe, expect, it } from 'vitest';
import { resolveCashDayState } from './cash-dates';

describe('estado de caja en hora de oficina', () => {
  const day = { id: 7, fecha: '2026-10-21', closedAt: null };
  it('mantiene abierta la caja antes de medianoche en México aunque Cancún ya cambió de día', () => {
    expect(resolveCashDayState(day, new Date('2026-10-22T05:30:00Z'))).toEqual({ openDayId: 7, openToday: true, pendingCloseDate: null });
  });
  it('marca pendiente de cierre al cambiar el día en México', () => {
    expect(resolveCashDayState(day, new Date('2026-10-22T06:00:00Z'))).toEqual({ openDayId: null, openToday: false, pendingCloseDate: '2026-10-21' });
  });
  it('no habilita una caja cerrada ni una caja inexistente', () => {
    expect(resolveCashDayState({ ...day, closedAt: '2026-10-21T23:00:00' }).openToday).toBe(false);
    expect(resolveCashDayState(null).pendingCloseDate).toBeNull();
  });
});
