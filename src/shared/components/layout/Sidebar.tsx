import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock3, X } from 'lucide-react';
import { ChequeIcon } from '@/shared/components/icons/ChequeIcon';
import { useAuth } from '@/modules/auth/store/auth.context';
import { cn } from '@/shared/lib/cn';
import chevronDown from '@/shared/assets/navigation/49590.svg';
import chevronUp from '@/shared/assets/navigation/519d3.svg';
import logoutIcon from '@/shared/assets/navigation/70f01.svg';
import cashLock from '@/shared/assets/navigation/73584.svg';
import cashLockActive from '@/shared/assets/navigation/c2d05.svg';
import { getNavProfile, getVisibleEntries, isNavItemActive, type NavEntry, type NavGroup, type NavItem } from './navigation';
import { useNavigationState } from './use-navigation-state';

interface SidebarProps { isOpen: boolean; onClose: () => void }
type Counts = ReturnType<typeof useNavigationState>['counts'];

function GroupBadge({ group, counts }: { group: NavGroup; counts: Counts }) {
  // Salidas no tiene aún un contador por solicitud. No mostramos una suma incompleta.
  if (group.children.some(child => child.id === 'cash-returns' || child.id === 'bank-returns')) return null;
  const badgeChildren = group.children.filter(child => child.badge);
  if (!badgeChildren.length || badgeChildren.some(child => counts[child.badge!] === null)) return null;
  const total = badgeChildren.reduce((sum, child) => sum + (counts[child.badge!] ?? 0), 0);
  return total > 0 ? <Badge count={total} /> : null;
}

function Badge({ count, active = false }: { count: number; active?: boolean }) {
  return <span aria-hidden="true" className={cn('inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-xs font-bold',
    active ? 'bg-white text-brand' : 'bg-warning text-slate-950')}>{count}</span>;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const profile = getNavProfile(user?.roles);
  const entries = profile ? getVisibleEntries(profile, user?.roles ?? []) : [];
  const { counts, cashOpen, cashStateKnown } = useNavigationState(profile?.role);
  const routeKey = `${location.pathname}${location.search}`;
  const [groupState, setGroupState] = useState<{ routeKey: string; overrides: Record<string, boolean> }>({ routeKey: '', overrides: {} });
  const groupOverrides = groupState.routeKey === routeKey ? groupState.overrides : {};

  function renderItem(item: NavItem, nested = false) {
    const active = isNavItemActive(item, location.pathname, location.search);
    const label = item.cashAction && cashStateKnown ? `${cashOpen ? 'Cerrar' : 'Abrir'} caja` : item.label;
    const glyph = item.cashAction && cashOpen
      ? (active ? cashLockActive : cashLock)
      : (active ? item.icon.active : item.icon.normal);
    const badge = item.badge ? counts[item.badge] : null;
    return <Link key={item.id} to={item.to} onClick={onClose} aria-current={active ? 'page' : undefined}
      className={cn('flex w-full items-center gap-[10px] rounded-[10px] transition-colors',
        nested ? 'min-h-[39px] px-3 py-2 text-sm' : 'min-h-[46px] px-4 py-[13px] text-base',
        active ? 'bg-brand font-semibold text-white shadow-brand' : nested ? 'text-[#a7b0c2] hover:bg-white/7 hover:text-white' : 'font-medium text-ink-inverse hover:bg-white/7 hover:text-white',
        item.cashAction && !active && (cashOpen ? 'text-[#f87171]' : 'text-[#4ade80]'))}>
      {item.id === 'cheques' ? <ChequeIcon className={cn('shrink-0', nested ? 'h-4 w-4' : 'h-5 w-5')} />
        : item.id === 'cash-deliveries' ? <Clock3 className={cn('shrink-0', nested ? 'h-4 w-4' : 'h-5 w-5')} />
          : <img alt="" src={glyph} className={cn('shrink-0', nested ? 'h-4 w-4' : 'h-5 w-5')} />}
      <span className="min-w-0 flex-1">{label}</span>
      {badge !== null && badge > 0 && <Badge count={badge} active={active} />}
    </Link>;
  }

  function renderGroup(group: NavGroup) {
    const childActive = group.children.some(child => isNavItemActive(child, location.pathname, location.search));
    const expanded = groupOverrides[group.id] ?? childActive;
    return <div key={group.id}>
      <button type="button" aria-expanded={expanded} aria-controls={`sidebar-group-${group.id}`}
        onClick={() => setGroupState({ routeKey, overrides: { ...groupOverrides, [group.id]: !expanded } })}
        className={cn('flex min-h-[46px] w-full items-center gap-[14px] rounded-xl px-4 py-[13px] text-left text-base font-medium text-ink-inverse hover:bg-white/7',
          expanded && 'bg-white/7 font-semibold text-white')}>
        <img alt="" src={expanded ? group.icon.active : group.icon.normal} className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1">{group.label}</span>
        {group.cashStatus && cashStateKnown && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', cashOpen ? 'bg-green-500/15 text-[#4ade80]' : 'bg-slate-500/20 text-slate-300')}>{cashOpen ? 'Abierta' : 'Cerrada'}</span>}
        {!expanded && <GroupBadge group={group} counts={counts} />}
        <img alt="" src={expanded ? chevronUp : chevronDown} className="h-[18px] w-[18px] shrink-0" />
      </button>
      {expanded && <div id={`sidebar-group-${group.id}`} className="ml-[26px] flex border-l-2 border-[#2a3245] pl-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">{group.children.map(child => renderItem(child, true))}</div>
      </div>}
    </div>;
  }

  return <>
    {isOpen && <div onClick={onClose} aria-hidden="true" className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" />}
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex h-full w-[min(312px,90vw)] shrink-0 flex-col bg-navigation text-white transition-transform duration-200 ease-in-out lg:static lg:w-[312px] lg:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex items-start justify-between gap-2 border-b border-[#1e2435] px-7 pb-7 pt-8">
        <div><h1 className="whitespace-nowrap text-[22px] font-bold leading-tight">Sistema de operaciones</h1>
          <p className="mt-1.5 text-[15px] text-slate-400">{profile?.label ?? 'Panel administrativo'}</p></div>
        <button type="button" aria-label="Cerrar menú" onClick={onClose} className="rounded-lg p-2 text-slate-300 lg:hidden"><X className="h-5 w-5" /></button>
      </div>
      <nav aria-label="Menú principal" className="sidebar-nav-scroll flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        {entries.map((entry: NavEntry) => entry.kind === 'item' ? renderItem(entry) : renderGroup(entry))}
      </nav>
      <div className="border-t border-[#1e2435] px-8 pb-7 pt-6">
        <button type="button" onClick={logout} className="flex items-center gap-3 text-base font-medium text-[#f87171] hover:text-red-300">
          <img alt="" src={logoutIcon} className="h-5 w-5" />Cerrar sesión
        </button>
      </div>
    </aside>
  </>;
}
