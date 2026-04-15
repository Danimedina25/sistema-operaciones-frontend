import { useAuth } from '@/modules/auth/store/auth.context';
import { NotificationsBell } from '@/modules/notifications/components/NotificationsBell';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Panel administrativo
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <NotificationsBell />

        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">
            {user?.nombre ?? 'Usuario'}
          </p>
          <p className="text-xs text-slate-500">{user?.correo ?? ''}</p>
        </div>
      </div>
    </header>
  );
}