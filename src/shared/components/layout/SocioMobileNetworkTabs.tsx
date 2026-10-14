import { NavLink } from 'react-router-dom';
import { paths } from '@/routes/paths';

export function SocioMobileNetworkTabs() {
  return <nav aria-label="Mi red" className="grid grid-cols-2 rounded-xl bg-slate-200/60 p-1 sm:hidden">
    <NavLink to={paths.clientes} className={({ isActive }) => `rounded-lg px-3 py-2 text-center text-sm ${isActive ? 'bg-white font-semibold text-slate-900 shadow-sm' : 'text-slate-500'}`}>Clientes</NavLink>
    <NavLink to={paths.mycomercialpartners} className={({ isActive }) => `rounded-lg px-3 py-2 text-center text-sm ${isActive ? 'bg-white font-semibold text-slate-900 shadow-sm' : 'text-slate-500'}`}>Socios comerciales</NavLink>
  </nav>;
}
