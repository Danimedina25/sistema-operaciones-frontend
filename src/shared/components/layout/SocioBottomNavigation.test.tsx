import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { SocioBottomNavigation } from './SocioBottomNavigation';

const auth = vi.hoisted(() => ({ roles: ['SOCIO_COMERCIAL'] }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { roles: auth.roles } }) }));

it('muestra cuatro destinos del Socio y marca Mi red en ambas pantallas', () => {
  render(<MemoryRouter initialEntries={['/socioscomerciales']}><SocioBottomNavigation /></MemoryRouter>);
  const nav = screen.getByRole('navigation', { name: 'Navegación inferior del Socio' });
  const links = within(nav).getAllByRole('link');
  expect(links.map((link) => link.textContent)).toEqual(['Mis pendientes', 'Operaciones', 'Mi red', 'Comisiones']);
  expect(within(nav).getByRole('link', { name: 'Mi red' })).toHaveAttribute('aria-current', 'page');
});

it('se oculta para otros roles', () => {
  auth.roles = ['GERENTE'];
  render(<MemoryRouter><SocioBottomNavigation /></MemoryRouter>);
  expect(screen.queryByRole('navigation', { name: 'Navegación inferior del Socio' })).not.toBeInTheDocument();
  auth.roles = ['SOCIO_COMERCIAL'];
});

it('mantiene Pendientes activo en el detalle de un retorno por solicitar', () => {
  render(<MemoryRouter initialEntries={['/retornos-por-solicitar/39']}><SocioBottomNavigation /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Mis pendientes' })).toHaveAttribute('aria-current', 'page');
});
