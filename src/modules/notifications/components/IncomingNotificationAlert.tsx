import type { NotificationResponse } from '@/modules/notifications/types/notifications.types';
import { Bell, ChevronRight, X } from 'lucide-react';

interface IncomingNotificationAlertProps {
  notification: NotificationResponse;
  onOpen: () => void;
  onClose: () => void;
  visible?: boolean;
}

export function IncomingNotificationAlert({
  notification,
  onOpen,
  onClose,
  visible = true,
}: IncomingNotificationAlertProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-[min(380px,calc(100vw-32px))] transition-all duration-200 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-slate-900/10">
        <div className="h-1 bg-blue-500" />
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Nueva notificación
            </p>

            <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-900">
              {notification.titulo}
            </p>

            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {notification.mensaje}
            </p>

            <button
              type="button"
              onClick={onOpen}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Ver detalle
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificación"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
