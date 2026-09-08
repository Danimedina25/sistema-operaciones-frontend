import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { TableFilterSection } from './TableFilterSection';

const auth = vi.hoisted(() => ({ user: { userId: 1 } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => auth }));
beforeEach(() => { window.sessionStorage.clear(); auth.user = { userId: 1 }; });

it('conserva el panel por ruta y usuario al recargar', async () => {
  const section = (route: string) => (
    <MemoryRouter initialEntries={[route]}><TableFilterSection>Filtros</TableFilterSection></MemoryRouter>
  );
  const first = render(section('/clients'));
  await userEvent.click(screen.getByRole('button', { name: /mostrar/i }));
  first.unmount();
  const reloaded = render(section('/clients'));
  expect(screen.getByRole('button', { name: /ocultar/i })).toHaveAttribute('aria-expanded', 'true');
  reloaded.unmount();
  const otherTable = render(section('/banks'));
  expect(screen.getByRole('button', { name: /mostrar/i })).toHaveAttribute('aria-expanded', 'false');
  otherTable.unmount();
  auth.user = { userId: 2 };
  render(section('/clients'));
  expect(screen.getByRole('button', { name: /mostrar/i })).toHaveAttribute('aria-expanded', 'false');
});
