import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { SocioPendingSummaryCards } from './SocioPendingSummaryCards';

const auth = vi.hoisted(() => ({ user: { userId: 1 } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => auth }));
vi.mock('@/modules/operations/hooks/use-socio-pending-summary', () => ({
  useSocioPendingSummary: () => ({
    enabled: true,
    isLoading: false,
    summary: { rejectedPayments: 1, pendingToRegister: 2, readyToRequestReturn: 3, returnsPendingConfirmation: 4, pendingCommissions: 5 },
  }),
}));

beforeEach(() => {
  window.sessionStorage.clear();
  auth.user = { userId: 1 };
});

const panel = <MemoryRouter><SocioPendingSummaryCards dateFilter="THIS_MONTH" startDate="" endDate="" /></MemoryRouter>;

it('inicia cerrado y restaura ambas selecciones al recargar', async () => {
  const first = render(panel);
  expect(screen.getByRole('button', { name: 'Mostrar' })).toHaveAttribute('aria-expanded', 'false');
  expect(window.sessionStorage.length).toBe(0);
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
  first.unmount();

  const reopened = render(panel);
  expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('Comprobantes rechazados')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Ocultar' }));
  reopened.unmount();

  render(panel);
  expect(screen.getByRole('button', { name: 'Mostrar' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText('Comprobantes rechazados')).not.toBeInTheDocument();
});

it('mantiene independiente el estado de cada socio', async () => {
  const first = render(panel);
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
  first.unmount();
  auth.user = { userId: 2 };
  const other = render(panel);
  expect(screen.getByRole('button', { name: 'Mostrar' })).toHaveAttribute('aria-expanded', 'false');
  other.unmount();
  auth.user = { userId: 1 };
  render(panel);
  expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-expanded', 'true');
});
