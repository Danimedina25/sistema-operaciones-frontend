import { describe, expect, it } from 'vitest';
import {
  canCancelReturnInstallment,
  canJefaDeliverInstallment,
  canSocioConfirmInstallment,
  cleanAuthorizedRecipients,
  computeBalanceAfterInstallment,
  HISTORICAL_RECEIVER_LABEL,
  installmentToCashDeliveryTarget,
  resolveDeliveryReceiverLabel,
  resolveInstallmentReceiverDisplay,
  resolveInstallmentSubmitLabel,
  resolveReceiverHistoryLabel,
  resolveRegisterInstallmentAvailability,
  resolveReturnHistoryHeading,
  resolveReturnModalTitle,
  resolveReturnRequestTotals,
  resolveReturnRowActions,
  shouldShowInstallmentHistory,
} from './return-installment';
import type {
  ReturnInstallment,
  ReturnInstallmentStatus,
} from '@/modules/operations/types/operations.types.ts';

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

describe('cleanAuthorizedRecipients', () => {
  it('elimina nulos, vacíos y espacios sobrantes', () => {
    expect(
      cleanAuthorizedRecipients([
        'María Gómez',
        null,
        undefined,
        '   ',
        '  Juan   Pérez  ',
      ]),
    ).toEqual(['María Gómez', 'Juan Pérez']);
  });

  it('quita duplicados sin distinguir mayúsculas ni espacios internos', () => {
    expect(
      cleanAuthorizedRecipients(['María Gómez', 'maría  gómez', 'MARÍA GÓMEZ']),
    ).toEqual(['María Gómez']);
  });

  it('lista vacía cuando no hay nombres válidos', () => {
    expect(cleanAuthorizedRecipients([null, '', '  '])).toEqual([]);
  });
});

describe('resolveDeliveryReceiverLabel / resolveReceiverHistoryLabel', () => {
  it('efectivo usa "recibió el efectivo"', () => {
    expect(resolveDeliveryReceiverLabel('EFECTIVO')).toBe('Persona que recibió el efectivo');
    expect(resolveReceiverHistoryLabel('EFECTIVO')).toBe('Persona que recibió');
  });

  it('retiro sin tarjeta usa "realizó el retiro"', () => {
    expect(resolveDeliveryReceiverLabel('RETIRO_SIN_TARJETA')).toBe(
      'Persona que realizó el retiro',
    );
    expect(resolveReceiverHistoryLabel('RETIRO_SIN_TARJETA')).toBe(
      'Persona que realizó el retiro',
    );
  });
});

describe('resolveInstallmentReceiverDisplay', () => {
  it('devuelve el nombre cuando está registrado', () => {
    expect(
      resolveInstallmentReceiverDisplay({
        tipoPago: 'EFECTIVO',
        estatus: 'COMPLETADA',
        personaQueRecibioEfectivo: 'María Gómez Díaz',
      }),
    ).toBe('María Gómez Díaz');
  });

  it('devuelve el texto histórico cuando la parcialidad está completada sin dato', () => {
    expect(
      resolveInstallmentReceiverDisplay({
        tipoPago: 'RETIRO_SIN_TARJETA',
        estatus: 'COMPLETADA',
        personaQueRecibioEfectivo: null,
      }),
    ).toBe(HISTORICAL_RECEIVER_LABEL);
  });

  it('devuelve null para métodos que no son efectivo/RST', () => {
    expect(
      resolveInstallmentReceiverDisplay({
        tipoPago: 'TRANSFERENCIA',
        estatus: 'COMPLETADA',
        personaQueRecibioEfectivo: null,
      }),
    ).toBeNull();
  });

  it('devuelve null si aún no se completa y no hay dato', () => {
    expect(
      resolveInstallmentReceiverDisplay({
        tipoPago: 'EFECTIVO',
        estatus: 'ENTREGADA',
        personaQueRecibioEfectivo: null,
      }),
    ).toBeNull();
  });
});

describe('installmentToCashDeliveryTarget', () => {
  const base: ReturnInstallment = {
    id: 7,
    returnRequestId: 3,
    operationId: 55,
    monto: 10000,
    tipoPago: 'EFECTIVO',
    estatus: 'ENTREGADA',
  };

  it('construye una lista de autorizados limpia y sin duplicados', () => {
    const target = installmentToCashDeliveryTarget({
      ...base,
      autorizadoParaRecibir1: 'María Gómez',
      autorizadoParaRecibir2: '  maría   gómez ',
      autorizadoParaRecibir3: 'Juan Pérez',
    });

    expect(target.autorizados).toEqual(['María Gómez', 'Juan Pérez']);
    expect(target.tipoPago).toBe('EFECTIVO');
  });

  it('lista vacía cuando la solicitud no tiene autorizados', () => {
    const target = installmentToCashDeliveryTarget(base);
    expect(target.autorizados).toEqual([]);
  });
});

describe('resolveReturnModalTitle', () => {
  it('efectivo: view → "Historial de recolecciones", manage → "Confirmar recolección"', () => {
    expect(
      resolveReturnModalTitle({ variant: 'view', tipoPago: 'EFECTIVO', estatus: 'EN_RECOLECCION' }),
    ).toBe('Historial de recolecciones');
    expect(
      resolveReturnModalTitle({ variant: 'manage', tipoPago: 'RETIRO_SIN_TARJETA', estatus: 'EN_RECOLECCION' }),
    ).toBe('Confirmar recolección');
  });

  it('no efectivo: view → "Historial de retornos", manage → "Retornar"/"Retorno"', () => {
    expect(
      resolveReturnModalTitle({ variant: 'view', tipoPago: 'TRANSFERENCIA', estatus: 'SOLICITADO' }),
    ).toBe('Historial de retornos');
    expect(
      resolveReturnModalTitle({ variant: 'manage', tipoPago: 'TRANSFERENCIA', estatus: 'SOLICITADO' }),
    ).toBe('Retornar');
    expect(
      resolveReturnModalTitle({ variant: 'manage', tipoPago: 'TRANSFERENCIA', estatus: 'RETORNADO' }),
    ).toBe('Retorno');
  });
});

describe('resolveReturnHistoryHeading', () => {
  it('nunca dice "Historial de retornos" para efectivo', () => {
    expect(resolveReturnHistoryHeading({ variant: 'view', tipoPago: 'EFECTIVO' })).toBe(
      'Historial de recolecciones',
    );
    expect(resolveReturnHistoryHeading({ variant: 'manage', tipoPago: 'EFECTIVO' })).toBe(
      'Recolecciones registradas',
    );
  });

  it('conserva la terminología de retornos para otros métodos', () => {
    expect(resolveReturnHistoryHeading({ variant: 'view', tipoPago: 'DEPOSITO' })).toBe(
      'Historial de retornos',
    );
    expect(resolveReturnHistoryHeading({ variant: 'manage', tipoPago: 'DEPOSITO' })).toBe(
      'Historial de retornos parciales',
    );
  });
});

describe('resolveReturnRowActions', () => {
  const efectivo = { tipoPago: 'EFECTIVO' as const };
  const transferencia = { tipoPago: 'TRANSFERENCIA' as const };
  const roles = {
    socio: { isSocioComercial: true, isJefaCajas: false, isAdmin: false },
    jefaCajas: { isSocioComercial: false, isJefaCajas: true, isAdmin: false },
    jefaCuentas: { isSocioComercial: false, isJefaCajas: false, isAdmin: false },
  };
  const programada = {
    tipoPago: 'EFECTIVO' as const,
    estatus: 'PROGRAMADA' as const,
    confirmadoPorSocio: false,
    cerradoPorJefa: false,
  };
  const soloJefa = { ...programada, estatus: 'ENTREGADA' as const, cerradoPorJefa: true };
  const soloSocio = { ...programada, estatus: 'ENTREGADA' as const, confirmadoPorSocio: true };
  const completada = { ...programada, estatus: 'COMPLETADA' as const, confirmadoPorSocio: true, cerradoPorJefa: true };

  it('efectivo: el botón principal siempre es "Ver recolección" (consulta)', () => {
    const r = resolveReturnRowActions({
      ...efectivo,
      parcialidades: [programada],
      canRegister: true,
      ...roles.jefaCajas,
    });
    expect(r.primaryLabel).toBe('Ver recolección');
    expect(r.primaryVariant).toBe('view');
  });

  it('efectivo: "Confirmar recolección" solo para la parte que falta confirmar', () => {
    // La jefa ya cerró, falta el socio → botón solo para el socio.
    expect(
      resolveReturnRowActions({ ...efectivo, parcialidades: [soloJefa], canRegister: false, ...roles.socio })
        .showConfirmRecoleccion,
    ).toBe(true);
    expect(
      resolveReturnRowActions({ ...efectivo, parcialidades: [soloJefa], canRegister: false, ...roles.jefaCajas })
        .showConfirmRecoleccion,
    ).toBe(false);

    // El socio ya confirmó, falta la jefa → botón solo para la jefa.
    expect(
      resolveReturnRowActions({ ...efectivo, parcialidades: [soloSocio], canRegister: false, ...roles.jefaCajas })
        .showConfirmRecoleccion,
    ).toBe(true);
    expect(
      resolveReturnRowActions({ ...efectivo, parcialidades: [soloSocio], canRegister: false, ...roles.socio })
        .showConfirmRecoleccion,
    ).toBe(false);
  });

  it('efectivo: ninguna acción sobre una recolección COMPLETADA', () => {
    for (const r of [roles.socio, roles.jefaCajas]) {
      expect(
        resolveReturnRowActions({ ...efectivo, parcialidades: [completada], canRegister: false, ...r })
          .showConfirmRecoleccion,
      ).toBe(false);
    }
  });

  it('efectivo: la jefa ve el botón para programar la primera recolección', () => {
    expect(
      resolveReturnRowActions({ ...efectivo, parcialidades: [], canRegister: true, ...roles.jefaCajas })
        .showConfirmRecoleccion,
    ).toBe(true);
    // El socio no puede programar → sin recolecciones no ve el botón.
    expect(
      resolveReturnRowActions({ ...efectivo, parcialidades: [], canRegister: false, ...roles.socio })
        .showConfirmRecoleccion,
    ).toBe(false);
  });

  it('efectivo: un rol que no opera efectivo nunca ve "Confirmar recolección"', () => {
    expect(
      resolveReturnRowActions({ ...efectivo, parcialidades: [soloSocio], canRegister: false, ...roles.jefaCuentas })
        .showConfirmRecoleccion,
    ).toBe(false);
  });

  it('no efectivo: "Retornar" (manage) si puede registrar, "Ver retorno" (view) si no', () => {
    const puede = resolveReturnRowActions({
      ...transferencia,
      parcialidades: [],
      canRegister: true,
      ...roles.jefaCuentas,
    });
    expect(puede).toMatchObject({ primaryLabel: 'Retornar', primaryVariant: 'manage' });

    const noPuede = resolveReturnRowActions({
      ...transferencia,
      parcialidades: [],
      canRegister: false,
      ...roles.socio,
    });
    expect(noPuede).toMatchObject({
      primaryLabel: 'Ver retorno',
      primaryVariant: 'view',
      showConfirmRecoleccion: false,
    });
  });
});

describe('canSocioConfirmInstallment / canJefaDeliverInstallment (doble firma independiente)', () => {
  const cash = (
    estatus: ReturnInstallmentStatus,
    marks: { confirmadoPorSocio?: boolean; cerradoPorJefa?: boolean } = {},
  ) => ({ tipoPago: 'EFECTIVO' as const, estatus, ...marks });

  it('en PROGRAMADA (sin ninguna marca) el socio y la jefa pueden actuar los dos', () => {
    const i = cash('PROGRAMADA');
    expect(canSocioConfirmInstallment(i, { isSocioComercial: true })).toBe(true);
    expect(
      canJefaDeliverInstallment(i, { isJefaCajas: true, isAdmin: false }),
    ).toBe(true);
  });

  it('en ENTREGADA solo falta la marca pendiente', () => {
    const soloSocio = cash('ENTREGADA', { confirmadoPorSocio: true, cerradoPorJefa: false });
    expect(canSocioConfirmInstallment(soloSocio, { isSocioComercial: true })).toBe(false);
    expect(
      canJefaDeliverInstallment(soloSocio, { isJefaCajas: true, isAdmin: false }),
    ).toBe(true);

    const soloJefa = cash('ENTREGADA', { confirmadoPorSocio: false, cerradoPorJefa: true });
    expect(canSocioConfirmInstallment(soloJefa, { isSocioComercial: true })).toBe(true);
    expect(
      canJefaDeliverInstallment(soloJefa, { isJefaCajas: true, isAdmin: false }),
    ).toBe(false);
  });

  it('ninguno puede actuar sobre COMPLETADA o CANCELADA', () => {
    for (const estatus of ['COMPLETADA', 'CANCELADA'] as const) {
      const i = cash(estatus);
      expect(canSocioConfirmInstallment(i, { isSocioComercial: true })).toBe(false);
      expect(
        canJefaDeliverInstallment(i, { isJefaCajas: true, isAdmin: false }),
      ).toBe(false);
    }
  });

  it('solo aplica a efectivo/RST', () => {
    const transferencia = {
      tipoPago: 'TRANSFERENCIA' as const,
      estatus: 'PROGRAMADA' as const,
    };
    expect(canSocioConfirmInstallment(transferencia, { isSocioComercial: true })).toBe(false);
    expect(
      canJefaDeliverInstallment(transferencia, { isJefaCajas: true, isAdmin: false }),
    ).toBe(false);
  });

  it('respeta el rol', () => {
    const i = cash('PROGRAMADA');
    expect(canSocioConfirmInstallment(i, { isSocioComercial: false })).toBe(false);
    expect(
      canJefaDeliverInstallment(i, { isJefaCajas: false, isAdmin: false }),
    ).toBe(false);
    expect(canJefaDeliverInstallment(i, { isJefaCajas: false, isAdmin: true })).toBe(true);
  });
});

describe('canCancelReturnInstallment', () => {
  const roles = {
    jefaCajas: { isAdmin: false, isJefaCajas: true, isJefaCuentas: false, isAuxiliarCuentas: false },
    jefaCuentas: { isAdmin: false, isJefaCajas: false, isJefaCuentas: true, isAuxiliarCuentas: false },
    admin: { isAdmin: true, isJefaCajas: false, isJefaCuentas: false, isAuxiliarCuentas: false },
  };

  it('cancelable en PROGRAMADA por el rol correspondiente al método', () => {
    expect(
      canCancelReturnInstallment(
        { tipoPago: 'EFECTIVO', estatus: 'PROGRAMADA' },
        roles.jefaCajas,
      ),
    ).toBe(true);
    expect(
      canCancelReturnInstallment(
        { tipoPago: 'TRANSFERENCIA', estatus: 'PROGRAMADA' },
        roles.jefaCuentas,
      ),
    ).toBe(true);
  });

  it('ya no es cancelable en cuanto hay una marca (ENTREGADA)', () => {
    expect(
      canCancelReturnInstallment(
        { tipoPago: 'EFECTIVO', estatus: 'ENTREGADA' },
        roles.jefaCajas,
      ),
    ).toBe(false);
  });

  it('admin puede cancelar cualquier método en PROGRAMADA', () => {
    expect(
      canCancelReturnInstallment(
        { tipoPago: 'EFECTIVO', estatus: 'PROGRAMADA' },
        roles.admin,
      ),
    ).toBe(true);
  });
});
