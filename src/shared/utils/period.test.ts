import { describe, expect, it } from 'vitest';
import { getPresetRange, officeToday, shiftDay } from './period';
import { formatPeriod } from '@/shared/format';

describe('periodos de la oficina', () => {
  const beforeMidnight = new Date('2026-10-12T04:30:00Z');
  const afterMidnight = new Date('2026-10-12T06:30:00Z');

  it('calcula hoy en America/Mexico_City aunque el instante UTC sea otro día', () => {
    expect(officeToday(beforeMidnight)).toBe('2026-10-11');
    expect(officeToday(afterMidnight)).toBe('2026-10-12');
    expect(getPresetRange('TODAY', beforeMidnight)).toEqual({ startDate: '2026-10-11', endDate: '2026-10-11' });
    expect(getPresetRange('TODAY', afterMidnight)).toEqual({ startDate: '2026-10-12', endDate: '2026-10-12' });
  });

  it('cierra la semana anterior el sábado y cruza mes/año sin depender de la zona del navegador', () => {
    expect(getPresetRange('LAST_WEEK', afterMidnight)).toEqual({ startDate: '2026-10-04', endDate: '2026-10-10' });
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
    expect(getPresetRange('LAST_MONTH', new Date('2026-01-02T18:00:00Z')))
      .toEqual({ startDate: '2025-12-01', endDate: '2025-12-31' });
  });

  it('presenta día, rango y todas las fechas con formatos compartidos', () => {
    expect(formatPeriod('2026-10-02', '2026-10-02')).toBe('2 oct 2026');
    expect(formatPeriod('2026-10-02', '2026-10-08')).toBe('2 – 8 oct 2026');
    expect(formatPeriod('2026-09-30', '2026-10-02')).toBe('30 sep – 2 oct 2026');
    expect(formatPeriod('', '')).toBe('Todas las fechas');
  });
});
