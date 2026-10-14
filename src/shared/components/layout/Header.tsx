import { ArrowLeft, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { NotificationsBell } from '@/modules/notifications/components/NotificationsBell';
import { getNavProfile } from './navigation';
import { paths } from '@/routes/paths';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user } = useAuth();
  const profile = getNavProfile(user?.roles);
  const location = useLocation();
  const navigate = useNavigate();
  const socioOperationId = profile?.role === 'SOCIO_COMERCIAL' ? location.pathname.match(/^\/operaciones\/(\d+)$/)?.[1] : undefined;
  const socioBackPath = socioOperationId || location.pathname === paths.operationCreate ? paths.operations : undefined;
  const socioMobileTitle = profile?.role === 'SOCIO_COMERCIAL'
    ? location.pathname === paths.myPending ? 'Mis pendientes'
      : location.pathname === paths.clientes || location.pathname === paths.mycomercialpartners ? 'Mi red'
      : location.pathname === paths.miscomisiones ? 'Mis comisiones'
      : location.pathname === paths.operations ? 'Operaciones'
      : location.pathname === paths.operationCreate ? 'Nueva operación'
      : socioOperationId ? `Operación #${socioOperationId}`
      : undefined
    : undefined;
  const isSocioMobileShell = Boolean(socioMobileTitle);
  const initials = (user?.nombre ?? 'Socio').split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();

  return (
    <header className={`sticky top-0 z-10 flex flex-shrink-0 items-center justify-between gap-5 border-b border-[#e5e7eb] bg-white px-4 lg:px-10 ${isSocioMobileShell ? 'h-16 sm:h-20' : 'h-20'}`}>
      <div className="flex min-w-0 items-center gap-3">
        {socioBackPath && <button type="button" onClick={() => navigate(socioBackPath)} aria-label="Volver a Operaciones" className="flex h-8 w-5 shrink-0 items-center justify-center text-slate-900 sm:hidden"><ArrowLeft className="h-5 w-5" /></button>}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Abrir menú"
          className={`h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden ${isSocioMobileShell ? 'hidden sm:flex' : 'flex'}`}
        >
          <Menu className="h-5 w-5" />
        </button>

        <h2 className="truncate text-lg font-semibold text-ink sm:text-xl">
          {isSocioMobileShell ? <><span className="sm:hidden">{socioMobileTitle}</span><span className="hidden sm:inline">{profile?.headerTitle}</span></> : profile?.headerTitle ?? 'Panel administrativo'}
        </h2>
      </div>

      <div className={`flex shrink-0 items-center gap-3 sm:gap-5 ${socioBackPath ? 'max-sm:hidden' : ''}`}>
        <NotificationsBell />

        {isSocioMobileShell && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white sm:hidden" title={user?.nombre ?? 'Socio'} aria-label={`Usuario ${user?.nombre ?? 'Socio'}`}>{initials}</span>}

        <div className="hidden text-right sm:block">
          <p className="text-base font-semibold text-ink">
            {user?.nombre ?? profile?.label ?? 'Usuario'}
          </p>
          <p className="text-sm text-ink-muted">{user?.correo ?? ''}</p>
        </div>
      </div>
    </header>
  );
}
