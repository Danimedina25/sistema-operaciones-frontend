import { describe, expect, it } from 'vitest';
import {
  computeBalanceAfterInstallment,
  resolveInstallmentSubmitLabel,
  resolveRegisterInstallmentAvailability,
  resolveReturnRequestTotals,
  shouldShowInstallmentHistory,
} from './return-installment';
import type { ReturnInstallmentStatus } from '@/modules/operations/types/operations.types.ts';

const inst = (estatus: ReturnInstallmentStatus) => ({ estatus });

describe('resolveReturnRequestTotals', () => {
  it('usa los totales del servidor cuando vienen', () => {
    const totals = resolveReturnRequestTotals({
      monto: 40000,
      montoSolicitado: 40000,
      montoRetornado: 15000,
      montoEnProceso: 5000,
      montoPendiente: 25000,
      montoDisponible: 20000,
      porcentajeAvance: 37.5,
      numeroParcialidades: 2,
      estatus: 'PARCIALMENTE_RETORNADO',
    });

    expect(totals.montoDisponible).toBe(20000);
    expect(totals.porcentajeAvance).toBe(37.5);
    expect(totals.numeroParcialidades).toBe(2);
  });

  it('calcula respaldos para datos previos a las parcialidades', () => {
    const totals = resolveReturnRequestTotals({
      monto: 10000,
      montoSolicitado: null,
      montoRetornado: null,
      montoEnProceso: null,
      montoPendiente: null,
      montoDisponible: null,
      porcentajeAvance: null,
      numeroParcialidades: null,
      estatus: 'RETORNADO',
    });

    expect(totals.montoSolicitado).toBe(10000);
    expect(totals.montoRetornado).toBe(10000);
    expect(totals.montoPendiente).toBe(0);
    expect(totals.montoDisponible).toBe(0);
    expect(totals.porcentajeAvance).toBe(100);
  });
});

describe('computeBalanceAfterInstallment', () => {
  it('resta el importe del disponible', () => {
    expect(computeBalanceAfterInstallment(25000, 20000)).toBe(5000);
  });

  it('nunca es negativo', () => {
    expect(computeBalanceAfterInstallment(10000, 15000)).toBe(0);
  });

  it('ignora importes no válidos', () => {
    expect(computeBalanceAfterInstallment(25000, 0)).toBe(25000);
    expect(computeBalanceAfterInstallment(25000, Number.NaN)).toBe(25000);
  });
});

describe('resolveRegisterInstallmentAvailability', () => {
  const totals = resolveReturnRequestTotals({
    monto: 40000,
    montoSolicitado: 40000,
    montoRetornado: 15000,
    montoEnProceso: 0,
    montoPendiente: 25000,
    montoDisponible: 25000,
    porcentajeAvance: 37.5,
    numeroParcialidades: 1,
    estatus: 'PARCIALMENTE_RETORNADO',
  });

  it('permite registrar cuando hay saldo, permiso y no está retornada', () => {
    const r = resolveRegisterInstallmentAvailability({
      totals,
      estatus: 'PARCIALMENTE_RETORNADO',
      hasPermission: true,
    });
    expect(r.canRegister).toBe(true);
  });

  it('bloquea sin permiso', () => {
    const r = resolveRegisterInstallmentAvailability({
      totals,
      estatus: 'PARCIALMENTE_RETORNADO',
      hasPermission: false,
    });
    expect(r.canRegister).toBe(false);
  });

  it('bloquea si ya está retornada', () => {
    const r = resolveRegisterInstallmentAvailability({
      totals,
      estatus: 'RETORNADO',
      hasPermission: true,
    });
    expect(r.canRegister).toBe(false);
  });

  it('bloquea sin saldo disponible', () => {
    const r = resolveRegisterInstallmentAvailability({
      totals: { ...totals, montoDisponible: 0 },
      estatus: 'PARCIALMENTE_RETORNADO',
      hasPermission: true,
    });
    expect(r.canRegister).toBe(false);
  });
});

describe('shouldShowInstallmentHistory', () => {
  const full = { montoRetornado: 40000, montoSolicitado: 40000 };
  const partial = { montoRetornado: 15000, montoSolicitado: 40000 };
  const none = { montoRetornado: 0, montoSolicitado: 40000 };

  it('oculta cuando no hay parcialidades', () => {
    expect(shouldShowInstallmentHistory(none, [])).toBe(false);
  });

  it('oculta cuando se retornó completo en un solo pago', () => {
    expect(shouldShowInstallmentHistory(full, [inst('COMPLETADA')])).toBe(false);
  });

  it('muestra con una sola parcialidad programada (aún no cuenta)', () => {
    expect(shouldShowInstallmentHistory(none, [inst('PROGRAMADA')])).toBe(true);
  });

  it('muestra con una parcialidad completada pero parcial', () => {
    expect(shouldShowInstallmentHistory(partial, [inst('COMPLETADA')])).toBe(true);
  });

  it('muestra con dos o más parcialidades', () => {
    expect(
      shouldShowInstallmentHistory(full, [inst('COMPLETADA'), inst('COMPLETADA')]),
    ).toBe(true);
  });

  it('muestra si hay parcialidades canceladas (deja rastro)', () => {
    expect(shouldShowInstallmentHistory(none, [inst('CANCELADA'), inst('CANCELADA')])).toBe(
      true,
    );
  });
});

describe('resolveInstallmentSubmitLabel', () => {
  const base = { montoRetornado: 0, montoEnProceso: 0, montoSolicitado: 40000 };

  it('sin actividad e importe vacío → "Registrar retorno"', () => {
    expect(
      resolveInstallmentSubmitLabel({ totals: base, importe: 0, esEfectivo: false }),
    ).toBe('Registrar retorno');
  });

  it('sin actividad e importe menor al total → "Registrar retorno parcial"', () => {
    expect(
      resolveInstallmentSubmitLabel({ totals: base, importe: 15000, esEfectivo: false }),
    ).toBe('Registrar retorno parcial');
  });

  it('sin actividad e importe igual al total → "Registrar retorno"', () => {
    expect(
      resolveInstallmentSubmitLabel({ totals: base, importe: 40000, esEfectivo: false }),
    ).toBe('Registrar retorno');
  });

  it('con actividad previa → siempre "Registrar retorno parcial"', () => {
    expect(
      resolveInstallmentSubmitLabel({
        totals: { ...base, montoRetornado: 10000 },
        importe: 30000,
        esEfectivo: false,
      }),
    ).toBe('Registrar retorno parcial');
  });

  it('efectivo con importe parcial → "Programar recolección parcial"', () => {
    expect(
      resolveInstallmentSubmitLabel({ totals: base, importe: 10000, esEfectivo: true }),
    ).toBe('Programar recolección parcial');
  });

  it('efectivo con importe total → "Programar recolección del retorno"', () => {
    expect(
      resolveInstallmentSubmitLabel({ totals: base, importe: 40000, esEfectivo: true }),
    ).toBe('Programar recolección del retorno');
  });
});
