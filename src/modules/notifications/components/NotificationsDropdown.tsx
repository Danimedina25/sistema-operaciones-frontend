import type { NotificationResponse } from '@/modules/notifications/types/notifications.types';
import {
  AlertTriangle,
  BellOff,
  Check,
  CheckCheck,
  ChevronRight,
  CircleDollarSign,
  FilePlus2,
  LoaderCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';

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

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const notificationPresentation = {
  OPERATION_CREATED: {
    icon: FilePlus2,
    iconClassName: 'bg-blue-50 text-blue-600',
  },
  PAYMENT_SUBMITTED: {
    icon: CircleDollarSign,
    iconClassName: 'bg-amber-50 text-amber-600',
  },
  PAYMENT_VALIDATED: {
    icon: Check,
    iconClassName: 'bg-emerald-50 text-emerald-600',
  },
  PAYMENT_REJECTED: {
    icon: XCircle,
    iconClassName: 'bg-red-50 text-red-600',
  },
  OPERATION_STATUS_CHANGED: {
    icon: RefreshCw,
    iconClassName: 'bg-violet-50 text-violet-600',
  },
  SYSTEM_ALERT: {
    icon: AlertTriangle,
    iconClassName: 'bg-orange-50 text-orange-600',
  },
} as const;

const moduleLabels = {
  OPERACIONES: 'Operaciones',
  PAGOS: 'Pagos',
  SISTEMA: 'Sistema',
} as const;

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
    <div className="fixed inset-x-4 top-16 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[410px]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Notificaciones</h3>
          <p className="text-xs text-slate-500">
            {unreadCount === 0
              ? 'Estás al día'
              : `${unreadCount} pendiente${unreadCount === 1 ? '' : 's'} de leer`}
          </p>
        </div>

        <button
          type="button"
          disabled={isMarkingAllAsRead || unreadCount === 0}
          onClick={() => void onMarkAllAsRead()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isMarkingAllAsRead ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isMarkingAllAsRead ? 'Marcando...' : 'Leer todas'}
        </button>
      </div>

      <div className="max-h-[min(460px,calc(100vh-96px))] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin text-blue-500" aria-hidden="true" />
            Cargando notificaciones
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <BellOff className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Sin notificaciones</p>
            <p className="mt-1 text-xs text-slate-500">Las novedades importantes aparecerán aquí.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const isProcessing = processingNotificationId === notification.id;
            const presentation = notificationPresentation[notification.tipo];
            const NotificationIcon = presentation.icon;

            return (
              <button
                key={notification.id}
                type="button"
                disabled={isProcessing}
                onClick={() => void onNotificationClick(notification)}
                className={`group relative block w-full border-b border-slate-100 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-slate-50 disabled:cursor-wait ${
                  !notification.leida ? 'bg-blue-50/40' : 'bg-white'
                }`}
              >
                {!notification.leida ? (
                  <span className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-blue-500" />
                ) : null}

                <div className="flex items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${presentation.iconClassName}`}>
                    <NotificationIcon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`line-clamp-1 text-sm text-slate-900 ${!notification.leida ? 'font-bold' : 'font-semibold'}`}>
                        {notification.titulo}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatRelativeDate(notification.createdAt)}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                      {notification.mensaje}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {moduleLabels[notification.modulo]}
                        </span>
                        {notification.prioridad === 'HIGH' ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-red-600">Prioridad alta</span>
                        ) : null}
                      </div>

                      {isProcessing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin text-blue-500" aria-label="Procesando" />
                      ) : notification.actionUrl ? (
                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" aria-hidden="true" />
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
