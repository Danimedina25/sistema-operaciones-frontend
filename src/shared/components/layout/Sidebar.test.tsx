import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

const mocks = vi.hoisted(() => ({
  roles: ['JEFA_CAJAS'] as string[],
  counts: { cashIncome: 3 as number | null, cashOutflow: 2 as number | null, bankIncome: 5 as number | null, commissions: 4 as number | null },
  cashPendingClose: null as string | null,
  cashOpen: true,
  cashStateKnown: true,
  urgency: {} as Record<string, string | null>,
}));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1, nombre: 'Prueba', roles: mocks.roles }, logout: vi.fn() }),
}));
vi.mock('./use-navigation-state', () => ({
  useNavigationState: () => ({ counts: mocks.counts, urgency: mocks.urgency, cashOpen: mocks.cashOpen, cashPendingClose: mocks.cashPendingClose, cashStateKnown: mocks.cashStateKnown }),
}));

function show(path: string) {
  render(<MemoryRouter initialEntries={[path]}><Sidebar isOpen onClose={vi.fn()} /></MemoryRouter>);
}

beforeEach(() => {
  mocks.roles = ['JEFA_CAJAS'];
  mocks.counts = { cashIncome: 3, cashOutflow: 2, bankIncome: 5, commissions: 4 };
  mocks.cashOpen = true;
  mocks.cashPendingClose = null;
  mocks.cashStateKnown = true;
  mocks.urgency = {};
});

describe('Sidebar', () => {
  it('permite expandir y contraer el menú de iconos y conserva los nombres accesibles', async () => {
    show('/operaciones');
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('lg:max-xl:w-[76px]');
    expect(screen.getByRole('link', { name: 'Operaciones' })).toHaveAttribute('title', 'Operaciones');
    await userEvent.click(screen.getByRole('button', { name: 'Expandir menú' }));
    expect(sidebar).not.toHaveClass('lg:max-xl:w-[76px]');
    await userEvent.click(screen.getByRole('button', { name: 'Contraer menú' }));
    expect(sidebar).toHaveClass('lg:max-xl:w-[76px]');
  });
  it('abre Caja por ruta activa y selecciona solo Entradas de efectivo', () => {
    show('/caja/entradas');
    expect(screen.getByRole('button', { name: /Caja.*Abierta/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /Entradas de efectivo/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Operaciones' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /Entradas de efectivo/ })).toHaveTextContent('3');
  });

  it('suma una vez los pagos y solicitudes y conserva las rutas viejas fuera del menú', async () => {
    show('/operaciones');
    const group = screen.getByRole('button', { name: /Caja.*Abierta/ });
    expect(group).toHaveAttribute('aria-expanded', 'false');
    expect(within(group).getByText('5')).toBeInTheDocument();
    await userEvent.click(group);
    expect(screen.queryByRole('link', { name: 'Cheques por cobrar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Entregas de hoy' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Salidas de efectivo/ })).toHaveTextContent('2');
    expect(screen.queryByRole('link', { name: 'Pendientes del equipo' })).toBeNull();
  });

  it('marca la caja anterior pendiente de cierre y conserva la acción Cerrar caja', () => {
    mocks.cashOpen = false;
    mocks.cashPendingClose = '2026-10-21';
    show('/caja/entradas');
    expect(screen.getByRole('button', { name: /Caja.*Pendiente de cierre/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cerrar caja' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Abrir caja' })).not.toBeInTheDocument();
  });

  it('muestra Abrir o Cerrar caja según el estado real', () => {
    show('/caja-general?nav=cash-session');
    expect(screen.getByRole('link', { name: 'Cerrar caja' })).toHaveAttribute('aria-current', 'page');
    cleanup();
    mocks.cashOpen = false;
    show('/caja-general?nav=cash-session');
    expect(screen.getByRole('link', { name: 'Abrir caja' })).toHaveAttribute('aria-current', 'page');
  });

  it('selecciona Transferir en su ruta propia', () => {
    mocks.roles = ['JEFA_CUENTAS'];
    show('/cuentas/transferir');
    expect(screen.getByRole('button', { name: 'Cuentas' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Transferir entre cuentas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Cortes y movimientos' })).not.toHaveAttribute('aria-current');
  });

  it('muestra el contador de Comisiones solo al Gerente', () => {
    mocks.roles = ['GERENTE'];
    show('/comisiones-socios');
    expect(screen.getByRole('link', { name: /Comisiones/ })).toHaveTextContent('4');
    cleanup();
    mocks.roles = ['DIRECCION'];
    show('/comisiones-socios');
    expect(screen.getByRole('link', { name: 'Comisiones' })).not.toHaveTextContent('4');
  });

  it('pinta en rojo el contador con pendientes urgentes, también en su grupo cerrado', () => {
    mocks.urgency = { cashIncome: 'urgent', cashOutflow: 'attention' };
    show('/caja/entradas');
    const income = screen.getByRole('link', { name: /Entradas de efectivo/ });
    expect(within(income).getByText('3')).toHaveClass('bg-white', 'text-red-600');
    expect(within(screen.getByRole('link', { name: /Salidas de efectivo/ })).getByText('2')).not.toHaveAttribute('data-urgent');
    cleanup();
    show('/operaciones');
    expect(within(screen.getByRole('button', { name: /Caja.*Abierta/ })).getByText('5')).toHaveClass('bg-red-500');
  });
});
