import type { NotificationResponse } from '@/modules/notifications/types/notifications.types';

interface NotificationsDropdownProps {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  isMarkingAllAsRead: boolean;
  processingNotificationId: number | null;
  onNotificationClick: (notification: NotificationResponse) => void | Promise<void>;
  onMarkAllAsRead: () => void | Promise<void>;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'Hace unos segundos';
  }

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `Hace ${minutes} min`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `Hace ${hours} h`;
  }

  return date.toLocaleString('es-MX');
}

export function NotificationsDropdown({
  notifications,
  unreadCount,
  isLoading,
  isMarkingAllAsRead,
  processingNotificationId,
  onNotificationClick,
  onMarkAllAsRead,
}: NotificationsDropdownProps) {
  return (
    <div className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Notificaciones</h3>
          <p className="text-xs text-slate-500">
            {unreadCount} no leída{unreadCount === 1 ? '' : 's'}
          </p>
        </div>

        <button
          type="button"
          disabled={isMarkingAllAsRead || unreadCount === 0}
          onClick={() => void onMarkAllAsRead()}
          className="text-xs font-medium text-slate-700 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMarkingAllAsRead ? 'Marcando...' : 'Marcar todas'}
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-sm text-slate-500">
            Cargando notificaciones...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            No tienes notificaciones por el momento.
          </div>
        ) : (
          notifications.map((notification) => {
            const isProcessing = processingNotificationId === notification.id;

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => void onNotificationClick(notification)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  !notification.leida ? 'bg-slate-50/80' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!notification.leida ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      ) : null}

                      <p className="truncate text-sm font-semibold text-slate-900">
                        {notification.titulo}
                      </p>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {notification.mensaje}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatRelativeDate(notification.createdAt)}
                    </p>
                  </div>

                  {isProcessing ? (
                    <span className="text-[11px] text-slate-400">...</span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}