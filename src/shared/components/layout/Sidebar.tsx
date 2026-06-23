import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Landmark,
  UserSquare,
  Network,
  ClipboardList,
  HandCoins,
  WalletCards,
  BadgeDollarSign,
  LogOut
} from 'lucide-react';

import { paths } from '@/routes/paths';
import { useAuth } from '@/modules/auth/store/auth.context';
import { cn } from '@/shared/lib/cn';
import { formatRoles } from '@/shared/utils/role-labels';
import type { RoleName } from '@/modules/auth/types/auth.types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: RoleName[];
}

const navItems: NavItem[] = [
   {
    to: paths.corte,
    label: 'Cortes y saldos',
    icon: LayoutDashboard,
    allowedRoles: ['ADMIN', 'GERENTE', 'DIRECCION'],
  },
  {
    to: paths.users,
    label: 'Usuarios',
    icon: Users,
    allowedRoles: ['ADMIN'],
  },
  {
    to: paths.bankAccounts,
    label: 'Cuentas bancarias',
    icon: Landmark,
    allowedRoles: ['ADMIN', 'AUXILIAR_CUENTAS'],
  },
  {
    to: paths.clientes,
    label: 'Clientes',
    icon: UserSquare,
    allowedRoles: ['ADMIN', 'SOCIO_COMERCIAL'],
  },
  {
    to: paths.mycomercialpartners,
    label: 'Mi red de socios comerciales',
    icon: Network,
    allowedRoles: ['ADMIN', 'SOCIO_COMERCIAL'],
  },
  {
    to: paths.operations,
    label: 'Operaciones',
    icon: ClipboardList,
    allowedRoles: ['ADMIN', 'SOCIO_COMERCIAL'],
  },
  {
    to: paths.returnsforrequest,
    label: 'Retornos por solicitar',
    icon: HandCoins,
  },
  {
    to: paths.returnsforpayment,
    label: 'Retornos por pagar',
    icon: WalletCards,
    allowedRoles: ['ADMIN'],
  },
  {
    to: paths.comisionessocios,
    label: 'Pago de comisiones a socios comerciales',
    icon: BadgeDollarSign,
    allowedRoles: ['ADMIN', 'JEFA_CAJAS'],
  },
  {
    to: paths.miscomisiones,
    label: 'Mis comisiones',
    icon: BadgeDollarSign,
    allowedRoles: ['ADMIN', 'SOCIO_COMERCIAL'],
  },
];
export function Sidebar() {
  const { logout, user, hasRole } = useAuth();

  const visibleNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return hasRole(item.allowedRoles);
  });

  return (
    <aside
      className="
    flex
    h-full
    w-72
    flex-shrink-0
    flex-col
    border-r
    border-white/10
    bg-slate-950
    text-white
  "
    >
      <div className="border-b border-white/10 px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Sistema de operaciones
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          {user ? formatRoles(user.roles) : 'Panel administrativo'}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? `
        bg-gradient-to-r
        from-blue-600
        to-blue-500
        text-white
        shadow-lg
        shadow-blue-500/20
      `
                  : `
        text-slate-300
        hover:bg-white/10
        hover:text-white
      `,
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={logout}
          className="
flex
w-full
items-center
gap-3
rounded-xl
px-4
py-3
text-sm
font-medium
text-red-400
transition-all
duration-200
hover:bg-red-500/10
hover:text-red-300
"        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}