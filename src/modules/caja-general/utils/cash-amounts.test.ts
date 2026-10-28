import { describe, expect, it } from 'vitest';
import { checkCount, countCents, emptyCounts, parseCents, validateCashAmount } from './cash-amounts';
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

describe('checkCount', () => {
  it('distingue cuadra, falta y sobra; solo sobrar es error', () => {
    expect(checkCount(150000, 150000)).toEqual({ tone: 'green', text: 'Total contado $1,500.00 · cuadra', error: null });
    expect(checkCount(100000, 150000)).toEqual({ tone: 'amber', text: 'Total contado $1,000.00 · faltan $500.00', error: null });
    expect(checkCount(500000, 150000)).toEqual({ tone: 'red', text: 'Total contado $5,000.00 · sobran $3,500.00', error: 'El conteo excede el monto por $3,500.00. Debe cuadrar exacto.' });
  });
  it('trata una cantidad inválida como error', () => {
    expect(checkCount(NaN, 150000)).toMatchObject({ tone: 'red', error: 'Revisa las cantidades capturadas.' });
  });
});
