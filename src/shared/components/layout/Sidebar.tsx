import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Landmark, LogOut, ReceiptText, UserRound, UserSquare, CreditCard } from 'lucide-react';
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
    to: paths.dashboard,
    label: 'Dashboard',
    icon: LayoutDashboard,
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
    icon: CreditCard,
    allowedRoles: ['ADMIN', 'GERENTE', 'AUXILIAR_CUENTAS'],
  },
  {
    to: paths.clientes,
    label: 'Clientes primarios',
    icon: UserSquare,
    allowedRoles: ['ADMIN'],
  },
   {
    to: paths.operations,
    label: 'Operaciones',
    icon: ReceiptText,
    allowedRoles: ['ADMIN', 'GERENTE', 'SOCIO_COMERCIAL'],
  },
];

export function Sidebar() {
  const { logout, user, hasRole } = useAuth();

  const visibleNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return hasRole(item.allowedRoles);
  });

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <h1 className="text-xl font-bold text-slate-900">Sistema de operaciones</h1>
        <p className="mt-1 text-sm text-slate-500">
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
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}