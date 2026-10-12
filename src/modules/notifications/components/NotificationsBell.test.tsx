import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { NotificationsBell } from './NotificationsBell';

const useNotifications = vi.hoisted(() => vi.fn(() => ({
  notifications: [], unreadCount: 0, isLoading: false,
  isMarkingAllAsRead: false, processingNotificationId: null,
  submitMarkAsRead: vi.fn(), submitMarkAllAsRead: vi.fn(),
  lastIncomingNotification: null, setLastIncomingNotification: vi.fn(),
})));
vi.mock('@/modules/notifications/hooks/use-notifications', () => ({ useNotifications }));
vi.mock('@/modules/notifications/components/NotificationsDropdown', () => ({ NotificationsDropdown: () => <div>Lista abierta</div> }));

it('solicita la lista de notificaciones solo al abrir la campana', async () => {
  render(<MemoryRouter><NotificationsBell /></MemoryRouter>);
  expect(useNotifications).toHaveBeenLastCalledWith({ limit: 10, listEnabled: false });
  await userEvent.click(screen.getByRole('button', { name: 'Notificaciones' }));
  expect(useNotifications).toHaveBeenLastCalledWith({ limit: 10, listEnabled: true });
  expect(screen.getByText('Lista abierta')).toBeInTheDocument();
});
