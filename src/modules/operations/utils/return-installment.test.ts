import { describe, expect, it } from 'vitest';
import {
  computeBalanceAfterInstallment,
  resolveRegisterInstallmentAvailability,
  resolveReturnRequestTotals,
} from './return-installment';

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
