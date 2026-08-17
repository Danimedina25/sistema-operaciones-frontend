import { describe, expect, it } from 'vitest';
import { comparePeriods } from './comparatives';

describe('comparePeriods', () => {
  it('calcula el cambio absoluto y porcentual cuando crece', () => {
    const result = comparePeriods(150, 100);
    expect(result.absoluteChange).toBe(50);
    expect(result.percentChange).toBe(50);
    expect(result.trend).toBe('UP');
  });

  it('calcula el cambio cuando baja', () => {
    const result = comparePeriods(80, 100);
    expect(result.absoluteChange).toBe(-20);
    expect(result.percentChange).toBe(-20);
    expect(result.trend).toBe('DOWN');
  });

  it('marca FLAT cuando no hay cambio', () => {
    const result = comparePeriods(100, 100);
    expect(result.absoluteChange).toBe(0);
    expect(result.percentChange).toBe(0);
    expect(result.trend).toBe('FLAT');
  });

  it('maneja división entre cero devolviendo percentChange null', () => {
    const result = comparePeriods(100, 0);
    expect(result.absoluteChange).toBe(100);
    expect(result.percentChange).toBeNull();
    expect(result.trend).toBe('UP');
  });

  it('maneja el caso 0 contra 0 sin producir NaN', () => {
    const result = comparePeriods(0, 0);
    expect(result.absoluteChange).toBe(0);
    expect(result.percentChange).toBeNull();
    expect(result.trend).toBe('FLAT');
  });
});
