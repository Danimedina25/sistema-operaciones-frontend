import { describe, expect, it } from 'vitest';
import { resolveDateFilterRange } from './date-filter-range';

describe('resolveDateFilterRange', () => {
  // Miércoles
  const now = new Date('2026-03-18T12:00:00.000Z');

  it('TODAY devuelve el mismo día como inicio y fin', () => {
    const result = resolveDateFilterRange('TODAY', '', '', now);
    expect(result).toEqual({ startDate: '2026-03-18', endDate: '2026-03-18' });
  });

  it('THIS_WEEK devuelve lunes a domingo de la semana actual', () => {
    const result = resolveDateFilterRange('THIS_WEEK', '', '', now);
    expect(result).toEqual({ startDate: '2026-03-16', endDate: '2026-03-22' });
  });

  it('THIS_MONTH devuelve el primer y último día del mes actual', () => {
    const result = resolveDateFilterRange('THIS_MONTH', '', '', now);
    expect(result).toEqual({ startDate: '2026-03-01', endDate: '2026-03-31' });
  });

  it('LAST_MONTH devuelve el primer y último día del mes pasado', () => {
    const result = resolveDateFilterRange('LAST_MONTH', '', '', now);
    expect(result).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' });
  });

  it('LAST_MONTH cruza el límite de año (enero -> diciembre del año anterior)', () => {
    const januaryNow = new Date('2026-01-15T12:00:00.000Z');
    const result = resolveDateFilterRange('LAST_MONTH', '', '', januaryNow);
    expect(result).toEqual({ startDate: '2025-12-01', endDate: '2025-12-31' });
  });

  it('sin filtro pero con rango custom, usa el rango custom tal cual', () => {
    const result = resolveDateFilterRange(
      '',
      '2026-01-05',
      '2026-01-10',
      now,
    );
    expect(result).toEqual({ startDate: '2026-01-05', endDate: '2026-01-10' });
  });

  it('sin filtro y sin rango custom, cae a la semana actual (lunes a domingo)', () => {
    const result = resolveDateFilterRange('', '', '', now);
    expect(result).toEqual({ startDate: '2026-03-16', endDate: '2026-03-22' });
  });

  it('THIS_WEEK cuando "now" es domingo sigue devolviendo lunes de esa semana', () => {
    const sunday = new Date('2026-03-22T12:00:00.000Z');
    const result = resolveDateFilterRange('THIS_WEEK', '', '', sunday);
    expect(result).toEqual({ startDate: '2026-03-16', endDate: '2026-03-22' });
  });
});
