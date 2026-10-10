import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

const mocks = vi.hoisted(() => ({
  roles: ['JEFA_CAJAS'] as string[],
  counts: { cashIncome: 3 as number | null, bankIncome: 5 as number | null, commissions: 4 as number | null },
  cashOpen: true,
  cashStateKnown: true,
}));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1, nombre: 'Prueba', roles: mocks.roles }, logout: vi.fn() }),
}));
vi.mock('./use-navigation-state', () => ({
  useNavigationState: () => ({ counts: mocks.counts, cashOpen: mocks.cashOpen, cashStateKnown: mocks.cashStateKnown }),
}));

function show(path: string) {
  render(<MemoryRouter initialEntries={[path]}><Sidebar isOpen onClose={vi.fn()} /></MemoryRouter>);
}

beforeEach(() => {
  mocks.roles = ['JEFA_CAJAS'];
  mocks.counts = { cashIncome: 3, bankIncome: 5, commissions: 4 };
  mocks.cashOpen = true;
  mocks.cashStateKnown = true;
});

describe('Sidebar', () => {
  it('abre Caja por ruta activa y selecciona solo Entradas de efectivo', () => {
    show('/operaciones?workQueue=CASH_INCOME&dateFilter=');
    expect(screen.getByRole('button', { name: /Caja.*Abierta/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /Entradas de efectivo/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Operaciones' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /Entradas de efectivo/ })).toHaveTextContent('3');
  });

  it('conserva Cheques y Entregas de hoy dentro de Caja y no suma tareas incompletas', async () => {
    show('/operaciones');
    const group = screen.getByRole('button', { name: /Caja.*Abierta/ });
    expect(group).toHaveAttribute('aria-expanded', 'false');
    expect(within(group).queryByText('3')).toBeNull();
    await userEvent.click(group);
    expect(screen.getByRole('link', { name: 'Cheques por cobrar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entregas de hoy' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pendientes del equipo' })).toBeNull();
  });

  it('muestra Abrir o Cerrar caja según el estado real', () => {
    show('/caja-general?nav=cash-session');
    expect(screen.getByRole('link', { name: 'Cerrar caja' })).toHaveAttribute('aria-current', 'page');
    cleanup();
    mocks.cashOpen = false;
    show('/caja-general?nav=cash-session');
    expect(screen.getByRole('link', { name: 'Abrir caja' })).toHaveAttribute('aria-current', 'page');
  });

  it('selecciona el hijo correcto cuando Cortes y movimientos y Transferir comparten ruta', () => {
    mocks.roles = ['JEFA_CUENTAS'];
    show('/corte/movimientos?nav=transfer');
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
});
