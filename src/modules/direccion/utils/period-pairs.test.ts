import { describe, expect, it } from 'vitest';
import { getComparativePeriodPairs } from './period-pairs';

describe('getComparativePeriodPairs', () => {
  // miércoles 14 de enero de 2026
  const now = new Date('2026-01-14T10:00:00.000Z');

  it('calcula hoy vs. ayer', () => {
    const [todayVsYesterday] = getComparativePeriodPairs(now);

    expect(todayVsYesterday.current).toEqual({ startDate: '2026-01-14', endDate: '2026-01-14' });
    expect(todayVsYesterday.previous).toEqual({ startDate: '2026-01-13', endDate: '2026-01-13' });
  });

  it('calcula esta semana (domingo a hoy) vs. la semana anterior completa', () => {
    const [, thisWeekVsPrev] = getComparativePeriodPairs(now);

    expect(thisWeekVsPrev.current).toEqual({ startDate: '2026-01-11', endDate: '2026-01-14' });
    expect(thisWeekVsPrev.previous).toEqual({ startDate: '2026-01-04', endDate: '2026-01-10' });
  });

  it('calcula este mes (día 1 a hoy) vs. el mes anterior completo', () => {
    const [, , thisMonthVsPrev] = getComparativePeriodPairs(now);

    expect(thisMonthVsPrev.current).toEqual({ startDate: '2026-01-01', endDate: '2026-01-14' });
    expect(thisMonthVsPrev.previous).toEqual({ startDate: '2025-12-01', endDate: '2025-12-31' });
  });

  it('cruza el límite de año correctamente para el mes anterior', () => {
    const januaryFirst = new Date('2026-01-05T10:00:00.000Z');
    const [, , thisMonthVsPrev] = getComparativePeriodPairs(januaryFirst);

    expect(thisMonthVsPrev.previous).toEqual({ startDate: '2025-12-01', endDate: '2025-12-31' });
  });
});
