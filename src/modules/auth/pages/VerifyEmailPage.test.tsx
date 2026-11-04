import { StrictMode } from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VerifyEmailPage from './VerifyEmailPage';

const mocks = vi.hoisted(() => ({
  completeEmailVerification: vi.fn(),
}));

vi.mock('@/modules/users/api/users.api', () => ({
  completeEmailVerification: mocks.completeEmailVerification,
}));

it('verifica el enlace una sola vez en el modo estricto de desarrollo', async () => {
  mocks.completeEmailVerification.mockResolvedValue(undefined);

  render(
    <StrictMode>
      <MemoryRouter initialEntries={['/verificar-correo?token=token-de-prueba']}>
        <VerifyEmailPage />
      </MemoryRouter>
    </StrictMode>,
  );

  expect(await screen.findByRole('heading', { name: 'Correo verificado' })).toBeInTheDocument();
  await waitFor(() => expect(mocks.completeEmailVerification).toHaveBeenCalledTimes(1));
  expect(mocks.completeEmailVerification).toHaveBeenCalledWith('token-de-prueba');
});
