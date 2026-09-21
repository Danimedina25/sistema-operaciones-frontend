import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({
    logout: vi.fn(),
    user: { roles: ['JEFA_CUENTAS'] },
    hasRole: () => true,
  }),
}));

vi.mock('@/modules/operations/hooks/use-pending-payments-count', () => ({
  usePendingPaymentsCount: () => ({ count: 0, enabled: false }),
}));

function renderSidebar(pathname: string) {
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <Sidebar isOpen onClose={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('activa solamente Movimientos bancarios en su ruta', () => {
    renderSidebar('/corte/movimientos');

    expect(screen.getByRole('link', { name: 'Movimientos bancarios' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Cortes y saldos' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('mantiene activo Cortes y saldos en la ruta exacta', () => {
    renderSidebar('/corte');

    expect(screen.getByRole('link', { name: 'Cortes y saldos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Movimientos bancarios' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
