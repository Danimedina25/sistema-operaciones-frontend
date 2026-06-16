import type { NotificationResponse } from '@/modules/notifications/types/notifications.types';

interface IncomingNotificationAlertProps {
  notification: NotificationResponse;
  onOpen: () => void;
  onClose: () => void;
}

export function IncomingNotificationAlert({
  notification,
  onOpen,
  onClose,
}: IncomingNotificationAlertProps) {
  return (
    <div className="fixed right-6 top-6 z-[9999] w-[360px] animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            🔔
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              Nueva notificación
            </p>

            <p className="mt-1 truncate text-sm font-medium text-slate-800">
              {notification.titulo}
            </p>

            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {notification.mensaje}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onOpen}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Ver
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}