import type { RoleName } from '@/modules/auth/types/auth.types';
import { paths } from '@/routes/paths';
import { ROUTE_ACCESS, type RouteAccessKey } from '@/shared/constants/access-control';
import list from '@/shared/assets/navigation/18cf1.svg';
import listActive from '@/shared/assets/navigation/83083.svg';
import clipboard from '@/shared/assets/navigation/6e2e0.svg';
import clipboardActive from '@/shared/assets/navigation/9bf2a.svg';
import vault from '@/shared/assets/navigation/42e14.svg';
import vaultActive from '@/shared/assets/navigation/0ddd1.svg';
import landmark from '@/shared/assets/navigation/3b92d.svg';
import landmarkActive from '@/shared/assets/navigation/ad268.svg';
import users from '@/shared/assets/navigation/1c2a8.svg';
import usersActive from '@/shared/assets/navigation/625b0.svg';
import dollar from '@/shared/assets/navigation/538a1.svg';
import dollarActive from '@/shared/assets/navigation/b53e4.svg';
import home from '@/shared/assets/navigation/ab9fd.svg';
import homeActive from '@/shared/assets/navigation/e751e.svg';
import wallet from '@/shared/assets/navigation/a9dbd.svg';
import walletActive from '@/shared/assets/navigation/6d321.svg';
import book from '@/shared/assets/navigation/03d5f.svg';
import bookActive from '@/shared/assets/navigation/b6671.svg';
import shield from '@/shared/assets/navigation/5eeef.svg';
import shieldActive from '@/shared/assets/navigation/2b4d1.svg';
import scroll from '@/shared/assets/navigation/9371c.svg';
import scrollActive from '@/shared/assets/navigation/02fc3.svg';
import down from '@/shared/assets/navigation/366ad.svg';
import downActive from '@/shared/assets/navigation/95b09.svg';
import up from '@/shared/assets/navigation/1fc5b.svg';
import upActive from '@/shared/assets/navigation/e83ec.svg';
import unlock from '@/shared/assets/navigation/42d04.svg';
import unlockActive from '@/shared/assets/navigation/e2647.svg';
import account from '@/shared/assets/navigation/cf63b.svg';
import accountActive from '@/shared/assets/navigation/a4532.svg';
import transfer from '@/shared/assets/navigation/2f74f.svg';
import transferActive from '@/shared/assets/navigation/b09d3.svg';
import person from '@/shared/assets/navigation/727cb.svg';
import personActive from '@/shared/assets/navigation/1603b.svg';
import network from '@/shared/assets/navigation/fe95d.svg';
import networkActive from '@/shared/assets/navigation/978c7.svg';
import settings from '@/shared/assets/navigation/8ad47.svg';
import settingsActive from '@/shared/assets/navigation/9b47d.svg';
import adminUsers from '@/shared/assets/navigation/f503e.svg';
import adminUsersActive from '@/shared/assets/navigation/d9857.svg';

export interface NavIcon { normal: string; active: string }
export interface NavItem {
  kind: 'item'; id: string; label: string; to: string; access: RouteAccessKey;
  icon: NavIcon; badge?: 'cashIncome' | 'cashOutflow' | 'bankIncome' | 'bankOutflow' | 'commissions';
  cashAction?: boolean;
}
export interface NavGroup {
  kind: 'group'; id: string; label: string; icon: NavIcon;
  children: NavItem[]; cashStatus?: boolean;
}
export type NavEntry = NavItem | NavGroup;
export interface NavProfile { role: RoleName; label: string; headerTitle: string; entries: NavEntry[] }

const icon = (normal: string, active: string): NavIcon => ({ normal, active });
const item = (id: string, label: string, to: string, access: RouteAccessKey, glyph: NavIcon, extra: Partial<NavItem> = {}): NavItem =>
  ({ kind: 'item', id, label, to, access, icon: glyph, ...extra });
const group = (id: string, label: string, glyph: NavIcon, children: NavItem[], cashStatus = false): NavGroup =>
  ({ kind: 'group', id, label, icon: glyph, children, cashStatus });

const pending = item('pending', 'Mis pendientes', paths.myPending, 'myPending', icon(list, listActive));
const operations = item('operations', 'Operaciones', paths.operations, 'operations', icon(clipboard, clipboardActive));
const clients = item('clients', 'Clientes', paths.clientes, 'clientes', icon(person, personActive));
const partners = item('partners', 'Socios comerciales', paths.mycomercialpartners, 'mycomercialpartners', icon(network, networkActive));
const balances = item('balances', 'Cuentas bancarias y saldos', paths.bankAccounts, 'bankAccounts', icon(account, accountActive));
const commissions = item('commissions', 'Comisiones', paths.comisionessocios, 'comisionessocios', icon(dollar, dollarActive));

const cashEntries: NavEntry[] = [
  pending,
  group('cash', 'Caja', icon(vault, vaultActive), [
    item('cash-cut', 'Corte', paths.cajaGeneral, 'cajaGeneral', icon(scroll, scrollActive)),
    item('cash-income', 'Entradas de efectivo', paths.cashIncome, 'cashIncome', icon(down, downActive), { badge: 'cashIncome' }),
    item('cash-returns', 'Salidas de efectivo', paths.cashOutflow, 'cashOutflow', icon(up, upActive), { badge: 'cashOutflow' }),
    item('cash-session', 'Abrir/Cerrar caja', `${paths.cajaGeneral}?nav=cash-session`, 'cajaGeneral', icon(unlock, unlockActive), { cashAction: true }),
  ], true),
  operations,
];

const bankEntries: NavEntry[] = [
  pending,
  group('accounts', 'Cuentas', icon(landmark, landmarkActive), [
    balances,
    item('bank-movements', 'Cortes y movimientos', paths.bankMovements, 'bankMovements', icon(scroll, scrollActive)),
    item('bank-income', 'Entradas bancarias', paths.bankIncome, 'bankIncome', icon(down, downActive), { badge: 'bankIncome' }),
    item('bank-returns', 'Salidas bancarias', paths.bankOutflow, 'bankOutflow', icon(up, upActive), { badge: 'bankOutflow' }),
    item('bank-transfer', 'Transferir entre cuentas', paths.bankTransfer, 'bankTransfer', icon(transfer, transferActive)),
  ]),
  operations,
];

const managementEntries: NavEntry[] = [
  item('home', 'Inicio', paths.dashboard, 'dashboard', icon(home, homeActive)),
  operations,
  { ...commissions, badge: 'commissions' },
  group('money', 'Dinero', icon(wallet, walletActive), [
    item('general-cut', 'Corte general', paths.generalCut, 'generalCut', icon(scroll, scrollActive)),
    balances,
  ]),
  group('catalogs', 'Catálogos', icon(book, bookActive), [clients, partners]),
  group('administration', 'Administración', icon(shield, shieldActive), [
    item('users', 'Usuarios', paths.users, 'users', icon(adminUsers, adminUsersActive)),
    item('configuration', 'Configuración', paths.configuraciones, 'configuraciones', icon(settings, settingsActive)),
  ]),
];

// Reportes y Bitácora se agregarán cuando exista una pantalla real.
// Dirección y Administración consultan Comisiones, sin contador de trabajo.
const directorEntries: NavEntry[] = managementEntries.map(entry =>
  entry.kind === 'item' && entry.id === 'commissions' ? { ...entry, badge: undefined } : entry);

export const NAVIGATION_BY_ROLE: Record<RoleName, NavProfile> = {
  SOCIO_COMERCIAL: { role: 'SOCIO_COMERCIAL', label: 'Socio Comercial', headerTitle: 'Panel administrativo', entries: [
    pending, operations, group('network', 'Mi red', icon(users, usersActive), [clients, partners]),
    item('my-commissions', 'Mis comisiones', paths.miscomisiones, 'miscomisiones', icon(dollar, dollarActive)),
  ] },
  JEFA_CAJAS: { role: 'JEFA_CAJAS', label: 'Jefa de Cajas', headerTitle: 'Panel administrativo', entries: cashEntries },
  JEFA_CUENTAS: { role: 'JEFA_CUENTAS', label: 'Jefa de Cuentas', headerTitle: 'Panel administrativo', entries: bankEntries },
  AUXILIAR_CUENTAS: { role: 'AUXILIAR_CUENTAS', label: 'Auxiliar de Cuentas', headerTitle: 'Panel administrativo', entries: bankEntries.map(entry => entry.kind === 'group' ? { ...entry, children: entry.children.filter(child => child.id !== 'bank-transfer') } : entry) },
  GERENTE: { role: 'GERENTE', label: 'Gerente', headerTitle: 'Panel administrativo', entries: managementEntries },
  DIRECCION: { role: 'DIRECCION', label: 'Director', headerTitle: 'Panel administrativo', entries: directorEntries },
  ADMIN: { role: 'ADMIN', label: 'Administrador', headerTitle: 'Panel administrativo', entries: directorEntries },
};

const rolePriority: RoleName[] = ['ADMIN', 'DIRECCION', 'GERENTE', 'JEFA_CAJAS', 'JEFA_CUENTAS', 'AUXILIAR_CUENTAS', 'SOCIO_COMERCIAL'];
export function getNavProfile(roles: readonly RoleName[] = []): NavProfile | null {
  const role = rolePriority.find(candidate => roles.includes(candidate));
  return role ? NAVIGATION_BY_ROLE[role] : null;
}

export function getVisibleEntries(profile: NavProfile, roles: readonly RoleName[]): NavEntry[] {
  const allowed = (access: RouteAccessKey) => roles.some(role => (ROUTE_ACCESS[access] as readonly RoleName[]).includes(role));
  const entries: NavEntry[] = [];
  for (const entry of profile.entries) {
    if (entry.kind === 'item') {
      if (allowed(entry.access)) entries.push(entry);
    } else {
      const children = entry.children.filter(child => allowed(child.access));
      if (children.length) entries.push({ ...entry, children });
    }
  }
  return entries;
}

export function isNavItemActive(item: NavItem, pathname: string, search: string): boolean {
  const target = new URL(item.to, 'http://local.test');
  if (pathname !== target.pathname) {
    if ((item.id === 'bank-income' || item.id === 'cash-income') && /^\/operaciones\/[^/]+$/.test(pathname) && new URLSearchParams(search).get('action') === 'review-payment') return true;
    if ((item.id === 'bank-returns' || item.id === 'cash-returns') && /^\/operaciones\/[^/]+$/.test(pathname) && new URLSearchParams(search).get('action') === 'manage-return') return true;
    if (item.id === 'operations' && /^\/operaciones\/[^/]+$/.test(pathname)) return true;
    if ((item.id === 'cash-returns' || item.id === 'bank-returns') && /^\/retornos-por-pagar\/[^/]+$/.test(pathname)) return true;
    return false;
  }
  const current = new URLSearchParams(search);
  for (const [key, value] of target.searchParams) {
    if (current.get(key) !== value) return false;
  }
  if (!target.searchParams.has('workQueue') && current.has('workQueue')) return false;
  if (!target.searchParams.has('nav') && current.has('nav')) return false;
  return true;
}
