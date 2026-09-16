import { describe, expect, it } from 'vitest';
import { formatBankAccountLabel, normalizeForSearch } from './bank-account-label';

describe('formatBankAccountLabel', () => {
  it('usa el formato Titular — Banco — Número', () => {
    expect(formatBankAccountLabel({ titular: 'Operaciones SA', banco: 'BBVA', numeroCuenta: '00012345678' }))
      .toBe('Operaciones SA — BBVA — 00012345678');
  });
});

describe('normalizeForSearch', () => {
  it('ignora mayúsculas y acentos', () => {
    expect(normalizeForSearch('Bajío')).toBe(normalizeForSearch('bajio'));
    expect(normalizeForSearch('Tesorería')).toBe('tesoreria');
  });

  it('ignora los separadores de los números de cuenta', () => {
    expect(normalizeForSearch('0001 2345-678')).toBe('00012345678');
  });
});
