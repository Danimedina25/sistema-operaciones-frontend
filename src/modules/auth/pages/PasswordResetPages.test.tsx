import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RequestPasswordResetPage from './RequestPasswordResetPage';
import ResetPasswordPage from './ResetPasswordPage';

const mocks = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  completePasswordReset: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/modules/auth/api/auth.api', () => ({
  requestPasswordReset: mocks.requestPasswordReset,
  completePasswordReset: mocks.completePasswordReset,
}));
vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ logout: mocks.logout }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it('solicita el enlace con el correo normalizado sin revelar si existe la cuenta', async () => {
  mocks.requestPasswordReset.mockResolvedValue(undefined);
  render(<MemoryRouter><RequestPasswordResetPage /></MemoryRouter>);

  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'SOCIO@PRUEBA.TEST');
  await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

  await waitFor(() => expect(mocks.requestPasswordReset).toHaveBeenCalledWith({ correo: 'socio@prueba.test' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Si el correo corresponde');
});

it('bloquea el restablecimiento cuando falta el token', () => {
  render(<MemoryRouter initialEntries={['/restablecer-password']}><ResetPasswordPage /></MemoryRouter>);

  expect(screen.getByRole('alert')).toHaveTextContent('no contiene un token');
  expect(screen.queryByRole('button', { name: 'Guardar contraseña' })).not.toBeInTheDocument();
});

it('muestra y oculta cada contraseña por separado sin borrar lo escrito', async () => {
  render(<MemoryRouter initialEntries={['/restablecer-password?token=token-de-prueba']}><ResetPasswordPage /></MemoryRouter>);

  const password = screen.getByLabelText('Nueva contraseña');
  const confirmation = screen.getByLabelText('Confirmar contraseña');
  await userEvent.type(password, 'NuevaClave2026!');
  await userEvent.type(confirmation, 'NuevaClave2026!');

  expect(password).toHaveAttribute('type', 'password');
  expect(confirmation).toHaveAttribute('type', 'password');

  await userEvent.click(screen.getByRole('button', { name: 'Mostrar nueva contraseña' }));
  expect(password).toHaveAttribute('type', 'text');
  expect(confirmation).toHaveAttribute('type', 'password');

  await userEvent.click(screen.getByRole('button', { name: 'Mostrar confirmación de contraseña' }));
  expect(confirmation).toHaveAttribute('type', 'text');

  await userEvent.click(screen.getByRole('button', { name: 'Ocultar nueva contraseña' }));
  expect(password).toHaveAttribute('type', 'password');
  expect(password).toHaveValue('NuevaClave2026!');
  expect(confirmation).toHaveValue('NuevaClave2026!');
  expect(mocks.completePasswordReset).not.toHaveBeenCalled();
});

it('valida la confirmación y completa el restablecimiento con el token', async () => {
  mocks.completePasswordReset.mockResolvedValue(undefined);
  render(<MemoryRouter initialEntries={['/restablecer-password?token=token-de-prueba']}><ResetPasswordPage /></MemoryRouter>);

  await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave2026!');
  await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'OtraClave2026!');
  await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
  expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
  expect(mocks.completePasswordReset).not.toHaveBeenCalled();

  await userEvent.clear(screen.getByLabelText('Confirmar contraseña'));
  await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'NuevaClave2026!');
  await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

  await waitFor(() => expect(mocks.completePasswordReset).toHaveBeenCalledWith({ token: 'token-de-prueba', password: 'NuevaClave2026!' }));
  expect(mocks.logout).toHaveBeenCalledOnce();
  expect(await screen.findByRole('status')).toHaveTextContent('Tu contraseña se actualizó');
});
