import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/modules/notifications/hooks/use-notifications';
import { NotificationsDropdown } from '@/modules/notifications/components/NotificationsDropdown';
import type { NotificationResponse } from '@/modules/notifications/types/notifications.types';

function BellIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

export function NotificationsBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    isMarkingAllAsRead,
    processingNotificationId,
    submitMarkAsRead,
    submitMarkAllAsRead,
  } = useNotifications({ limit: 10 });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification: NotificationResponse) => {
  try {
    if (!notification.leida) {
      await submitMarkAsRead(notification.id);
    }

    setIsOpen(false);

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  } catch {
   
  }
};

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        aria-label="Abrir notificaciones"
      >
        <BellIcon />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <NotificationsDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          isMarkingAllAsRead={isMarkingAllAsRead}
          processingNotificationId={processingNotificationId}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={submitMarkAllAsRead}
        />
      ) : null}
    </div>
  );
}