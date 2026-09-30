import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useNotificationReceived } from './use-notification-received';
import { emitNotificationReceived } from '@/modules/notifications/services/notification-events';
import type { NotificationResponse, NotificationType } from '@/modules/notifications/types/notifications.types';

function notification(tipo: NotificationType): NotificationResponse {
  return {
    id: 1, titulo: 't', mensaje: 'm', tipo, modulo: 'PAGOS', referenceType: 'BANK_CASH_WITHDRAWAL',
    referenceId: 5, actionUrl: '/corte', prioridad: 'MEDIUM', leida: false, createdAt: '2026-09-30T10:00:00',
  };
}

describe('useNotificationReceived', () => {
  it('sólo reacciona a los tipos indicados y deja de escuchar al desmontar', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useNotificationReceived(['BANK_WITHDRAWAL_CONFIRMED'], handler));

    act(() => emitNotificationReceived(notification('PAYMENT_VALIDATED')));
    expect(handler).not.toHaveBeenCalled();

    act(() => emitNotificationReceived(notification('BANK_WITHDRAWAL_CONFIRMED')));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].referenceId).toBe(5);

    unmount();
    act(() => emitNotificationReceived(notification('BANK_WITHDRAWAL_CONFIRMED')));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('usa siempre la versión más reciente del handler', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useNotificationReceived(['BANK_WITHDRAWAL_CONFIRMED'], fn), {
      initialProps: { fn: first },
    });
    rerender({ fn: second });
    act(() => emitNotificationReceived(notification('BANK_WITHDRAWAL_CONFIRMED')));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
