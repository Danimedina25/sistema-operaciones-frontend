import { describe, expect, it } from 'vitest';
import { formatCashDate, formatCashDateTime } from './cash-dates';

describe('formato de fechas de Caja General', () => {
  it('muestra una fecha legible y conserva el valor ISO', () => {
    expect(formatCashDate('2026-09-15')).toBe('15 de Septiembre del 2026 (2026-09-15)');
  });

  it('formatea fecha y hora sin alterar valores inválidos', () => {
    expect(formatCashDateTime('2026-09-15T17:08:30')).toBe('15 de Septiembre del 2026 (2026-09-15) · 17:08 h');
    expect(formatCashDate('2026-02-30')).toBe('2026-02-30');
    expect(formatCashDate('sin-fecha')).toBe('sin-fecha');
  });
});
