import { describe, expect, it } from 'vitest';
import { computePeriodRange } from './period-range';

describe('computePeriodRange', () => {
  const now = new Date('2026-01-14T10:00:00.000Z'); // miércoles

  it('TODAY devuelve el mismo día como inicio y fin', () => {
    expect(computePeriodRange('TODAY', now)).toEqual({
      startDate: '2026-01-14',
      endDate: '2026-01-14',
    });
  });

  it('THIS_WEEK devuelve desde el domingo hasta hoy', () => {
    expect(computePeriodRange('THIS_WEEK', now)).toEqual({
      startDate: '2026-01-11',
      endDate: '2026-01-14',
    });
  });

  it('THIS_MONTH devuelve desde el primer día del mes hasta hoy', () => {
    expect(computePeriodRange('THIS_MONTH', now)).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-01-14',
    });
  });

  it('CUSTOM devuelve el rango provisto tal cual', () => {
    expect(
      computePeriodRange('CUSTOM', now, { startDate: '2026-01-01', endDate: '2026-01-10' }),
    ).toEqual({ startDate: '2026-01-01', endDate: '2026-01-10' });
  });

  it('CUSTOM sin rango provisto cae al día de hoy', () => {
    expect(computePeriodRange('CUSTOM', now)).toEqual({
      startDate: '2026-01-14',
      endDate: '2026-01-14',
    });
  });
});
