import { describe, expect, it } from 'vitest';
import { oldestOf, pendingUrgency, worstUrgency } from './pending-urgency';

const thresholds = { horasPendienteAtencion: 4, horasPendienteUrgente: 24 };
// 27 oct 2026, 12:00 en la oficina (UTC−6).
const now = new Date('2026-10-27T18:00:00Z');

describe('pendingUrgency', () => {
  it('sin pendientes está al día aunque haya una fecha vieja', () => {
    expect(pendingUrgency(0, '2026-10-01T09:00:00', thresholds, now)).toBe('none');
  });

  it.each([
    ['2026-10-27T08:01:00', 'recent'],
    ['2026-10-27T08:00:00', 'attention'],
    ['2026-10-26T12:01:00', 'attention'],
    ['2026-10-26T12:00:00', 'urgent'],
  ])('el más antiguo de %s queda como %s', (oldest, expected) => {
    expect(pendingUrgency(2, oldest, thresholds, now)).toBe(expected);
  });

  it('usa los umbrales que vengan de Configuración', () => {
    expect(pendingUrgency(1, '2026-10-27T10:00:00', { horasPendienteAtencion: 1, horasPendienteUrgente: 2 }, now)).toBe('urgent');
  });

  it('sin fecha del más antiguo no inventa una alerta', () => {
    expect(pendingUrgency(3, null, thresholds, now)).toBe('recent');
  });
});

describe('agrupación', () => {
  it('el grupo toma el nivel más atrasado y la fecha más antigua', () => {
    expect(worstUrgency(['none', 'attention', 'recent'])).toBe('attention');
    expect(worstUrgency([])).toBe('none');
    expect(oldestOf(null, '2026-10-27T08:00:00', '2026-10-25T09:30:00', undefined)).toBe('2026-10-25T09:30:00');
  });
});
