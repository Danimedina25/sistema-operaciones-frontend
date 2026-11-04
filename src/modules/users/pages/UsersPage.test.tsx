import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from './UsersPage';

const auth = vi.hoisted(() => ({ roles: ['DIRECCION'] as string[] }));
vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1, roles: auth.roles },
    hasRole: (allowed: string | readonly string[]) => [allowed].flat().some(role => auth.roles.includes(role)) }),
}));
vi.mock('@/modules/users/hooks/use-users', () => ({ useUsers: () => ({ users: [], isLoading: false, error: null, refetch: vi.fn() }) }));
vi.mock('@/modules/users/hooks/use-create-user', () => ({ useCreateUser: () => ({ isSubmitting: false, submitCreateUser: vi.fn() }) }));
vi.mock('@/modules/users/hooks/use-update-user', () => ({ useUpdateUser: () => ({ isSubmitting: false, submitUpdateUser: vi.fn() }) }));
vi.mock('@/modules/users/hooks/use-update-user-email', () => ({ useUpdateUserEmail: () => ({ isSubmitting: false, submitUpdateUserEmail: vi.fn() }) }));
vi.mock('@/modules/users/hooks/use-delete-user', () => ({ useDeleteUser: () => ({ isDeleting: false, submitDeleteUser: vi.fn() }) }));

const renderPage = () => render(<MemoryRouter><UsersPage /></MemoryRouter>);

beforeEach(() => { auth.roles = ['DIRECCION']; });

describe('alta de usuarios', () => {
  it('el Director puede crear usuarios, pero no asignar el rol de Administrador', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '+ Nuevo usuario' }));
    const roles = within(screen.getByRole('dialog')).getAllByRole('option').map(option => option.textContent);
    expect(roles).toContain('Auxiliar de Cuentas');
    expect(roles).not.toContain('Administrador');
  });

  it('el Gerente no ve el alta de usuarios', () => {
    auth.roles = ['GERENTE'];
    renderPage();
    expect(screen.queryByRole('button', { name: '+ Nuevo usuario' })).toBeNull();
  });

  it('el Administrador sí puede asignar el rol de Administrador', () => {
    auth.roles = ['ADMIN'];
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '+ Nuevo usuario' }));
    const roles = within(screen.getByRole('dialog')).getAllByRole('option').map(option => option.textContent);
    expect(roles).toContain('Administrador');
  });
});
