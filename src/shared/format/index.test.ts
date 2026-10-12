import { describe, expect, it } from 'vitest';
import { formatAccount, formatDate, formatDateTime, formatElapsedSince, formatMoney, formatPercent } from './index';

describe('fechas de la oficina', () => {
  it('usa las doce abreviaturas fijas, sin punto', () => {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    months.forEach((month, index) => {
      expect(formatDate(`2026-${String(index + 1).padStart(2, '0')}-02`)).toBe(`2 ${month} 2026`);
    });
  });

  it('conserva LocalDate y LocalDateTime ISO del backend como hora de oficina', () => {
    expect(formatDate('2026-10-02')).toBe('2 oct 2026');
    expect(formatDateTime('2026-10-02T18:55:43.123456')).toBe('2 oct 2026, 18:55');
    expect(formatDateTime('2026-10-02T00:00:00')).toBe('2 oct 2026, 00:00');
  });

  it('convierte instantes UTC y con offset, incluso al cruzar la medianoche', () => {
    expect(formatDateTime('2026-10-03T00:55:00Z')).toBe('2 oct 2026, 18:55');
    expect(formatDate('2026-10-03T00:55:00Z')).toBe('2 oct 2026');
    expect(formatDateTime('2026-10-02T23:59:00-06:00')).toBe('2 oct 2026, 23:59');
    expect(formatDateTime('2026-10-03T06:00:00Z')).toBe('3 oct 2026, 00:00');
  });

  it('acepta Date y devuelve guion para fechas ausentes o inválidas', () => {
    expect(formatDateTime(new Date('2026-10-03T00:55:00Z'))).toBe('2 oct 2026, 18:55');
    expect(formatDate(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDate('2026-02-30')).toBe('—');
  });

  it('calcula el tiempo sin avanzar en la zona de la oficina', () => {
    const now = new Date('2026-10-03T06:00:00Z');
    expect(formatElapsedSince('2026-10-02T23:00:00', now)).toBe('1 h');
    expect(formatElapsedSince('2026-10-01T00:00:00', now)).toBe('2 días');
  });
});

describe('números y cuentas', () => {
  it('muestra dinero con dos decimales y signo menos tipográfico', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
    expect(formatMoney(-1234.5)).toBe('−$1,234.50');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
  });

  it('muestra porcentajes con hasta dos decimales y sin ceros sobrantes', () => {
    expect(formatPercent(1.5)).toBe('1.5%');
    expect(formatPercent(1.25)).toBe('1.25%');
    expect(formatPercent(2)).toBe('2%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
  });

  it('enmascara cuentas, incluso con menos de cuatro dígitos', () => {
    expect(formatAccount('banorte', '0121 8000 1234 8998')).toBe('BANORTE ••8998');
    expect(formatAccount('Bbva', '123')).toBe('BBVA ••123');
    expect(formatAccount('Banorte', '7')).toBe('BANORTE ••7');
    expect(formatAccount('Banorte', '')).toBe('—');
    expect(formatAccount(null, '1234')).toBe('—');
  });
});
