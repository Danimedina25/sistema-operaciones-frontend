import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsDropdown } from './NotificationsDropdown';
import type { NotificationResponse } from '@/modules/notifications/types/notifications.types';

const baseNotification: NotificationResponse = {
  id: 1,
  titulo: 'Recolección de retorno programada',
  mensaje: 'Se programó la recolección de una parcialidad.',
  tipo: 'RETURN_INSTALLMENT_SCHEDULED',
  modulo: 'PAGOS',
  referenceType: 'RETURN_INSTALLMENT',
  referenceId: 10,
  actionUrl: '/operaciones/55?scrollToReturns=true',
  prioridad: 'HIGH',
  leida: false,
  readAt: null,
  createdAt: new Date().toISOString(),
};

function renderDropdown(notifications: NotificationResponse[]) {
  return render(
    <NotificationsDropdown
      notifications={notifications}
      unreadCount={notifications.filter((n) => !n.leida).length}
      isLoading={false}
      isMarkingAllAsRead={false}
      processingNotificationId={null}
      onNotificationClick={vi.fn()}
      onMarkAllAsRead={vi.fn()}
    />,
  );
}

describe('NotificationsDropdown', () => {
  it('renderiza notificaciones de parcialidades de retorno sin romperse', () => {
    renderDropdown([
      baseNotification,
      { ...baseNotification, id: 2, tipo: 'RETURN_INSTALLMENT_COMPLETED' },
      { ...baseNotification, id: 3, tipo: 'RETURN_REQUEST_COMPLETED' },
      { ...baseNotification, id: 4, tipo: 'RETURN_INSTALLMENT_CANCELLED' },
    ]);

    expect(
      screen.getAllByText('Recolección de retorno programada'),
    ).toHaveLength(4);
  });

  it('no revienta con un tipo de notificación desconocido (fallback)', () => {
    renderDropdown([
      {
        ...baseNotification,
        // Tipo que el backend podría enviar y el frontend aún no conoce.
        tipo: 'FUTURO_TIPO_NO_MAPEADO' as NotificationResponse['tipo'],
        modulo: 'DESCONOCIDO' as NotificationResponse['modulo'],
      },
    ]);

    expect(screen.getByText('Recolección de retorno programada')).toBeInTheDocument();
    expect(screen.getByText('DESCONOCIDO')).toBeInTheDocument();
  });
});
