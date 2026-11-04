import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const mocks = vi.hoisted(() => ({ submitLogin: vi.fn() }));
vi.mock('@/modules/auth/hooks/use-login', () => ({
  useLogin: () => ({ submitLogin: mocks.submitLogin, isSubmitting: false }),
}));

beforeEach(() => vi.clearAllMocks());

it('envía la elección Recordarme y enlaza a la recuperación disponible', async () => {
  mocks.submitLogin.mockResolvedValue(undefined);
  render(<MemoryRouter><LoginPage /></MemoryRouter>);

  expect(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toHaveAttribute('href', '/recuperar-password');
  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'prueba.socio@prueba.test');
  await userEvent.type(screen.getByLabelText('Contraseña', { exact: true }), 'LocalSolo2026!');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Recordarme' }));
  await userEvent.click(screen.getByRole('button', { name: 'Entrar al sistema' }));

  await waitFor(() => expect(mocks.submitLogin).toHaveBeenCalledWith({
    correo: 'prueba.socio@prueba.test', password: 'LocalSolo2026!',
  }, true));
});
