import { Menu } from 'lucide-react';
import { useAuth } from '@/modules/auth/store/auth.context';
import { NotificationsBell } from '@/modules/notifications/components/NotificationsBell';
import { getNavProfile } from './navigation';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user } = useAuth();
  const profile = getNavProfile(user?.roles);

  return (
    <header className="sticky top-0 z-10 flex h-20 flex-shrink-0 items-center justify-between gap-5 border-b border-[#e5e7eb] bg-white px-4 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Abrir menú"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h2 className="truncate text-lg font-semibold text-ink sm:text-xl">
          {profile?.headerTitle ?? 'Panel administrativo'}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <NotificationsBell />

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
