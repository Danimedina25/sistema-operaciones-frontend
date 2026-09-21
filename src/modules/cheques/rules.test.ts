import { describe, expect, it } from 'vitest';
import { allowedChequeActions, validateChequeCommand } from './rules';
import type { Cheque, ChequeCommand } from './types';
import type { RoleName } from '@/modules/auth/types/auth.types';
import { emptyCounts } from '@/modules/caja-general/utils/cash-amounts';
const cheque = { estado: 'POR_COBRAR', requiereConciliacion: false, monto: 100 } as Cheque;
const role = (name: RoleName) => (roles: RoleName[]) => roles.includes(name);
const command: ChequeCommand = { requestId: 'abc', version: 1, accion: 'COBRAR_BANCO', fecha: '2026-09-20', cuentaDestinoId: 1, comprobanteUrl: 'proof' };
describe('cheque collection boundaries', () => {
  it('separates cash reception from bank management', () => {
    expect(allowedChequeActions(cheque, role('JEFA_CUENTAS'))).not.toContain('COBRAR_EFECTIVO');
    expect(allowedChequeActions(cheque, role('JEFA_CAJAS'))).toEqual(['COBRAR_EFECTIVO']);
    expect(allowedChequeActions(cheque, role('SOCIO_COMERCIAL'))).toEqual([]);
  });
  it.each(['COBRADO', 'DEVUELTO', 'CANCELADO'] as const)('blocks ordinary movements after %s', estado => {
    expect(allowedChequeActions({ ...cheque, estado }, role('ADMIN'))).toEqual([]);
  });
  it('never infers collection from historical validation', () => {
    expect(allowedChequeActions({ ...cheque, requiereConciliacion: true }, role('ADMIN'))).toEqual([]);
    expect(allowedChequeActions({ ...cheque, estado: null }, role('ADMIN'))).toEqual([]);
  });
  it('does not allow cash collection or a second deposit while clearing', () => {
    expect(allowedChequeActions({ ...cheque, estado: 'DEPOSITADO' }, role('ADMIN'))).toEqual(['COBRAR_BANCO', 'DEVOLVER']);
  });
  it('requires account and proof for bank collection', () => {
    expect(validateChequeCommand(cheque, command, ['COBRAR_BANCO'])).toBeNull();
    expect(validateChequeCommand(cheque, { ...command, cuentaDestinoId: undefined }, ['COBRAR_BANCO'])).toContain('cuenta');
    expect(validateChequeCommand(cheque, { ...command, comprobanteUrl: undefined }, ['COBRAR_BANCO'])).toContain('comprobante');
  });
  it('requires an open cash day and exact denominations for cash collection', () => {
    const cash: ChequeCommand = { ...command, accion: 'COBRAR_EFECTIVO', cuentaDestinoId: undefined, denominaciones: { ...emptyCounts(), D100: 1 } };
    expect(validateChequeCommand(cheque, cash, ['COBRAR_EFECTIVO'])).toContain('Abre');
    expect(validateChequeCommand(cheque, { ...cash, diaCajaId: 1 }, ['COBRAR_EFECTIVO'])).toBeNull();
    expect(validateChequeCommand(cheque, { ...cash, diaCajaId: 1, denominaciones: emptyCounts() }, ['COBRAR_EFECTIVO'])).toContain('desglose');
  });
  it('requires a reason and rejects unauthorized commands', () => {
    expect(validateChequeCommand(cheque, { ...command, accion: 'DEVOLVER' }, ['DEVOLVER'])).toContain('motivo');
    expect(validateChequeCommand(cheque, command, [])).toContain('no está permitida');
  });
});
