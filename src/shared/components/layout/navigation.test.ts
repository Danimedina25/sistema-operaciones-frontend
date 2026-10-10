import { describe, expect, it } from 'vitest';
import type { RoleName } from '@/modules/auth/types/auth.types';
import { ROUTE_ACCESS } from '@/shared/constants/access-control';
import { getNavProfile, getVisibleEntries, type NavEntry } from './navigation';

function labels(entries: NavEntry[]): string[] {
  return entries.map(entry => entry.kind === 'item' ? entry.label : `${entry.label} (${entry.children.map(child => child.label).join(', ')})`);
}

describe('navegación por rol', () => {
  it.each<[RoleName, string[]]>([
    ['SOCIO_COMERCIAL', ['Mis pendientes', 'Operaciones', 'Mi red (Clientes, Socios comerciales)', 'Mis comisiones']],
    ['JEFA_CAJAS', ['Mis pendientes', 'Caja (Corte, Entradas de efectivo, Cheques por cobrar, Salidas de efectivo, Entregas de hoy, Abrir/Cerrar caja)', 'Operaciones']],
    ['JEFA_CUENTAS', ['Mis pendientes', 'Cuentas (Cuentas bancarias y saldos, Cortes y movimientos, Entradas bancarias, Salidas bancarias, Transferir entre cuentas)', 'Operaciones']],
    ['AUXILIAR_CUENTAS', ['Mis pendientes', 'Cuentas (Cuentas bancarias y saldos, Cortes y movimientos, Entradas bancarias, Salidas bancarias)', 'Operaciones']],
    ['GERENTE', ['Inicio', 'Operaciones', 'Comisiones', 'Dinero (Corte general, Cuentas bancarias y saldos)', 'Catálogos (Clientes, Socios comerciales)', 'Administración (Usuarios, Configuración)']],
    ['DIRECCION', ['Inicio', 'Operaciones', 'Comisiones', 'Dinero (Corte general, Cuentas bancarias y saldos)', 'Catálogos (Clientes, Socios comerciales)', 'Administración (Usuarios, Configuración)']],
    ['ADMIN', ['Inicio', 'Operaciones', 'Comisiones', 'Dinero (Corte general, Cuentas bancarias y saldos)', 'Catálogos (Clientes, Socios comerciales)', 'Administración (Usuarios, Configuración)']],
  ])('%s respeta el orden y las opciones disponibles', (role, expected) => {
    const profile = getNavProfile([role]);
    expect(profile).not.toBeNull();
    const entries = getVisibleEntries(profile!, [role]);
    expect(labels(entries)).toEqual(expected);
    for (const entry of entries) {
      const items = entry.kind === 'item' ? [entry] : entry.children;
      for (const item of items) expect((ROUTE_ACCESS[item.access] as readonly RoleName[])).toContain(role);
    }
  });

  it('filtra opciones cuya ruta no permite el rol', () => {
    const cashProfile = getNavProfile(['JEFA_CAJAS'])!;
    const socioProfile = getNavProfile(['SOCIO_COMERCIAL'])!;
    const restrictedItem = socioProfile.entries.find(entry => entry.kind === 'item' && entry.id === 'my-commissions')!;
    const entries = getVisibleEntries({ ...cashProfile, entries: [...cashProfile.entries, restrictedItem] }, ['JEFA_CAJAS']);
    expect(labels(entries).join(' ')).not.toContain('Mis comisiones');
  });

  it('Caja › Corte y las opciones temporales apuntan a pantallas existentes', () => {
    const cash = getVisibleEntries(getNavProfile(['JEFA_CAJAS'])!, ['JEFA_CAJAS']);
    const group = cash.find(entry => entry.kind === 'group');
    expect(group?.kind).toBe('group');
    if (group?.kind !== 'group') return;
    expect(group.children.find(child => child.label === 'Corte')?.to).toBe('/caja-general');
    expect(group.children.find(child => child.label === 'Entradas de efectivo')?.to).toContain('workQueue=CASH_INCOME');
    expect(group.children.find(child => child.label === 'Salidas de efectivo')?.to).toContain('workQueue=CASH_RETURNS');
  });
});
