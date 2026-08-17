import { describe, expect, it } from 'vitest';
import { classifyAging } from './aging';

describe('classifyAging', () => {
  const now = new Date('2026-01-10T12:00:00.000Z');

  it('clasifica como verde cuando han pasado menos de 24 horas', () => {
    const result = classifyAging(null, '2026-01-10T00:00:01.000Z', now);
    expect(result.level).toBe('GREEN');
  });

  it('clasifica como amarillo justo en el umbral de 24 horas', () => {
    const result = classifyAging(null, '2026-01-09T12:00:00.000Z', now);
    expect(result.level).toBe('YELLOW');
  });

  it('clasifica como amarillo entre 24 y 48 horas', () => {
    const result = classifyAging(null, '2026-01-09T00:00:00.000Z', now);
    expect(result.level).toBe('YELLOW');
  });

  it('clasifica como rojo justo en el umbral de 48 horas', () => {
    const result = classifyAging(null, '2026-01-08T12:00:00.000Z', now);
    expect(result.level).toBe('RED');
  });

  it('clasifica como rojo con más de 48 horas', () => {
    const result = classifyAging(null, '2026-01-01T00:00:00.000Z', now);
    expect(result.level).toBe('RED');
  });

  it('prioriza la fecha efectiva sobre createdAt cuando está disponible', () => {
    const result = classifyAging(
      '2026-01-10T11:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
      now,
    );
    expect(result.level).toBe('GREEN');
    expect(result.dateUsed).toBe('2026-01-10T11:00:00.000Z');
  });

  it('cae a createdAt si no hay fecha efectiva', () => {
    const result = classifyAging(undefined, '2026-01-01T00:00:00.000Z', now);
    expect(result.dateUsed).toBe('2026-01-01T00:00:00.000Z');
  });
});
