import { Menu } from 'lucide-react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { NotificationsBell } from '@/modules/notifications/components/NotificationsBell';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Abrir menú"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
          Panel administrativo
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <NotificationsBell />

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {user?.nombre ?? 'Usuario'}
          </p>
          <p className="text-xs text-slate-500">{user?.correo ?? ''}</p>
        </div>
      </div>
    </header>
  );
}