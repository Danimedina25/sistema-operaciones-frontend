import { describe, expect, it } from 'vitest';
import { maskAccountNumber } from './account-formatting';

describe('maskAccountNumber', () => {
  it('muestra solo los últimos 4 dígitos de una CLABE de 18 dígitos', () => {
    expect(maskAccountNumber('012180001234567895')).toBe('••••7895');
  });

  it('quita espacios antes de enmascarar', () => {
    expect(maskAccountNumber('0121 8000 1234 5678 95')).toBe('••••7895');
  });

  it('devuelve el valor tal cual si tiene 4 dígitos o menos', () => {
    expect(maskAccountNumber('1234')).toBe('1234');
  });

  it('devuelve un guion para valores nulos o vacíos', () => {
    expect(maskAccountNumber(null)).toBe('—');
    expect(maskAccountNumber(undefined)).toBe('—');
    expect(maskAccountNumber('')).toBe('—');
  });
});
