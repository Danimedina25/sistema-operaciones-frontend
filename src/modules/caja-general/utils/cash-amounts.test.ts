import { describe, expect, it } from 'vitest';
import { countCents, emptyCounts, parseCents, validateCashAmount } from './cash-amounts';
describe('Caja General: importes exactos', () => {
  it('suma todas las denominaciones sin perder monedas de 50 centavos', () => {
    const counts = emptyCounts(); counts.D1000 = 2; counts.D20 = 3; counts.D050 = 3;
    expect(countCents(counts)).toBe(206150);
    expect(validateCashAmount('2061.50', counts)).toBeNull();
    expect(validateCashAmount('2061.51', counts)).toContain('exactamente');
  });
  it.each(['1.001', '-1', 'NaN', 'Infinity', '', '1e3', '1,000', '10000000000000'])('rechaza importe inválido %s', value => {
    expect(Number.isNaN(parseCents(value))).toBe(true);
  });
  it('rechaza cantidades fraccionadas y negativas', () => {
    expect(Number.isNaN(countCents({ ...emptyCounts(), D1: -1 }))).toBe(true);
    expect(Number.isNaN(countCents({ ...emptyCounts(), D1: 0.5 }))).toBe(true);
  });
  it('permite saldo cero pero no movimientos cero', () => {
    expect(validateCashAmount('0', emptyCounts())).toBeNull();
    expect(validateCashAmount('0', emptyCounts(), true)).toContain('importe válido');
  });
});
