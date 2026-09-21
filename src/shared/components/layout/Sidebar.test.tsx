import { cleanup, render, screen } from '@testing-library/react';
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
  // Movimientos bancarios dejó de ser una entrada propia: es una pestaña dentro de
  // Cortes y saldos, así que su URL debe resaltar esa única opción.
  it('no ofrece una entrada aparte para Movimientos bancarios', () => {
    renderSidebar('/corte');

    expect(screen.queryByRole('link', { name: 'Movimientos bancarios' })).toBeNull();
  });

  it('mantiene activo Cortes y saldos en sus dos rutas', () => {
    renderSidebar('/corte');
    expect(screen.getByRole('link', { name: 'Cortes y saldos' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    cleanup();

    renderSidebar('/corte/movimientos');
    expect(screen.getByRole('link', { name: 'Cortes y saldos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
