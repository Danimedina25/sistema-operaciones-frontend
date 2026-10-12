import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { paths } from '@/routes/paths';
import { getNavProfile, getVisibleEntries, isNavItemActive, type NavEntry } from './navigation';

/** Accesos móviles del Socio, derivados de la misma definición que usa Sidebar. */
export function SocioBottomNavigation() {
  const { user } = useAuth();
  const location = useLocation();
  const profile = getNavProfile(user?.roles);
  if (profile?.role !== 'SOCIO_COMERCIAL') return null;
  const entries = getVisibleEntries(profile, user?.roles ?? []);
  const tabs = entries.map((entry: NavEntry) => entry.kind === 'group'
    ? { id: entry.id, label: entry.label, to: entry.children[0]?.to, icon: entry.icon, active: entry.children.some((child) => isNavItemActive(child, location.pathname, location.search)) }
    : { id: entry.id, label: entry.label, to: entry.to, icon: entry.icon,
      active: isNavItemActive(entry, location.pathname, location.search) ||
        (entry.id === 'pending' && (location.pathname.startsWith(paths.returnsforrequest) || location.pathname.startsWith(paths.returnsRequested))) })
    .filter((tab) => Boolean(tab.to));
  return <nav aria-label="Navegación inferior del Socio" className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(15,23,42,0.08)] md:hidden">
    <div className="grid grid-cols-4">{tabs.map((tab) => <Link key={tab.id} to={tab.to!} aria-current={tab.active ? 'page' : undefined}
      className={`flex min-h-[68px] flex-col items-center justify-center gap-1 text-[11px] font-medium ${tab.active ? 'text-[#3b6ef5]' : 'text-slate-500'}`}>
      <span className={`flex h-8 min-w-11 items-center justify-center rounded-full ${tab.active ? 'bg-blue-100' : ''}`}>
        <img alt="" src={tab.icon.normal} className="h-5 w-5"
          style={tab.active ? { filter: 'brightness(0) saturate(100%) invert(41%) sepia(89%) saturate(2105%) hue-rotate(205deg) brightness(98%) contrast(94%)' } : undefined} />
      </span>
      <span>{tab.id === 'my-commissions' ? 'Comisiones' : tab.label}</span>
    </Link>)}</div>
  </nav>;
}
