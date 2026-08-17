import { describe, expect, it } from 'vitest';
import { calculateConcentration, isAboveConcentrationThreshold } from './concentration';

describe('calculateConcentration', () => {
  it('calcula el porcentaje del principal y de los tres primeros', () => {
    const result = calculateConcentration([
      { id: 1, amount: 500 },
      { id: 2, amount: 300 },
      { id: 3, amount: 100 },
      { id: 4, amount: 100 },
    ]);

    expect(result.totalAmount).toBe(1000);
    expect(result.topEntryPercent).toBe(50);
    expect(result.topThreePercent).toBe(90);
  });

  it('maneja lista vacía sin dividir entre cero', () => {
    const result = calculateConcentration([]);
    expect(result.totalAmount).toBe(0);
    expect(result.topEntryPercent).toBe(0);
    expect(result.topThreePercent).toBe(0);
  });

  it('maneja un total de 0 sin producir NaN', () => {
    const result = calculateConcentration([{ id: 1, amount: 0 }]);
    expect(result.topEntryPercent).toBe(0);
  });

  it('no muta el arreglo original al ordenar', () => {
    const entries = [
      { id: 1, amount: 10 },
      { id: 2, amount: 90 },
    ];
    calculateConcentration(entries);
    expect(entries[0].id).toBe(1);
  });
});

describe('isAboveConcentrationThreshold', () => {
  it('detecta cuando se supera el umbral', () => {
    const result = calculateConcentration([
      { id: 1, amount: 80 },
      { id: 2, amount: 20 },
    ]);
    expect(isAboveConcentrationThreshold(result, 70)).toBe(true);
    expect(isAboveConcentrationThreshold(result, 90)).toBe(false);
  });
});
