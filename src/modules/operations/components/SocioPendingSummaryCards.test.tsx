import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { OperationsFilters } from './OperationsFilters';
import type { OperationsFilters as Filters } from '../types/operations.types.ts';
import { useUrlFilters } from '@/shared/hooks/use-url-filters';
import type { SocioPendingSummaryParams } from '../hooks/use-socio-pending-summary';
import { SocioPendingSummaryCards } from './SocioPendingSummaryCards';

const auth = vi.hoisted(() => ({ user: { userId: 1 } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => auth }));
vi.mock('@/modules/operations/hooks/use-socio-pending-summary', () => ({
  useSocioPendingSummary: () => ({
    enabled: true,
    isLoading: false,
    summary: { rejectedPayments: 1, pendingToRegister: 2, readyToRequestReturn: 3, returnsPendingConfirmation: 4 },
  }),
}));

beforeEach(() => {
  window.sessionStorage.clear();
  auth.user = { userId: 1 };
});

const panel = <MemoryRouter><SocioPendingSummaryCards dateFilter="THIS_MONTH" startDate="" endDate="" /></MemoryRouter>;

it('inicia cerrado y restaura ambas selecciones al recargar', async () => {
  const first = render(panel);
  expect(screen.getByRole('button', { name: 'Mostrar' })).toHaveAttribute('aria-expanded', 'false');
  expect(window.sessionStorage.length).toBe(0);
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
  first.unmount();

  const reopened = render(panel);
  expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('Comprobantes rechazados')).toBeInTheDocument();
  expect(screen.queryByText('Ingresos parciales por completar')).not.toBeInTheDocument();
  expect(screen.queryByText(/Comisiones pendientes/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Ocultar' }));
  reopened.unmount();

  render(panel);
  expect(screen.getByRole('button', { name: 'Mostrar' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText('Comprobantes rechazados')).not.toBeInTheDocument();
});

it('mantiene independiente el estado de cada socio', async () => {
  const first = render(panel);
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
  first.unmount();
  auth.user = { userId: 2 };
  const other = render(panel);
  expect(screen.getByRole('button', { name: 'Mostrar' })).toHaveAttribute('aria-expanded', 'false');
  other.unmount();
  auth.user = { userId: 1 };
  render(panel);
  expect(screen.getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-expanded', 'true');
});

const destinationDefaults = {
  operationId: 0, paymentTypes: '', cuentaDestinoId: 0, banco: '', socioComercialId: 0,
  dateFilter: 'THIS_MONTH', startDate: '', endDate: '', activo: 'ACTIVE',
  status: 'ALL', paymentStatus: '', returnStatuses: '', search: '', commissionStatus: 'ALL',
};
function Destination() {
  const { pathname } = useLocation();
  const { filters } = useUrlFilters(destinationDefaults, 'destination-cache');
  return <><OperationsFilters filters={filters as Filters} onChange={() => {}} /><output>{JSON.stringify({ ...filters, pathname })}</output></>;
}

const periods: SocioPendingSummaryParams[] = [
  { dateFilter: 'LAST_MONTH', startDate: '', endDate: '' },
  { dateFilter: '', startDate: '2026-07-03', endDate: '2026-07-19' },
  { dateFilter: '', startDate: '', endDate: '' },
];
const cards = [
  ['Comprobantes rechazados', 'status', 'RECHAZADA', '/operaciones'],
  ['Saldo pendiente por registrar', 'status', 'INGRESO_PARCIAL', '/operaciones'],
  ['Listas para solicitar retorno', 'status', 'ALL', '/retornos-por-solicitar'],
  ['Retornos pendientes de confirmar', 'returnStatuses', 'EN_RECOLECCION', '/retornos-solicitados'],
];
it.each(periods.flatMap((period) => cards.map(([label, key, value, path]) => ({ period, label, key, value, path }))))(
  'transmite el período $period y criterio de $label sin recuperar filtros viejos',
  async ({ period, label, key, value, path }) => {
    window.sessionStorage.setItem('destination-cache', JSON.stringify({ ...destinationDefaults, search: 'viejo', status: 'RECHAZADA' }));
    render(
      <MemoryRouter initialEntries={['/mis-pendientes']}>
        <Routes>
          <Route path="/mis-pendientes" element={<SocioPendingSummaryCards {...period} />} />
          <Route path="*" element={<Destination />} />
        </Routes>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    await userEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
    const received = JSON.parse(screen.getByRole('status').textContent ?? '{}');
    expect(received[key]).toBe(value);
    expect(received.search).toBe('');
    expect(received.activo).toBe('ACTIVE');
    expect(received.pathname).toBe(path);
    {
      expect(received).toMatchObject(period);
      expect(received.paymentStatus).toBe('');
      expect(screen.queryByText('Estatus del comprobante')).not.toBeInTheDocument();
      if (key === 'status' && value !== 'ALL') {
        const labels: Record<string, string> = { RECHAZADA: 'Rechazada', PENDIENTE_VALIDACION: 'Pendiente validación', INGRESO_PARCIAL: 'Ingreso parcial', VALIDADA: 'Validada' };
        expect(screen.getByRole('button', { name: labels[value] })).toHaveAttribute('aria-pressed', 'true');
      }
    }
  },
);
