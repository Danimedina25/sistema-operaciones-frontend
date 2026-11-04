import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CommercialPartnerCommissionsPage from './CommercialPartnerCommissionsPage';

// Comisiones de operaciones de octubre pagadas en noviembre: el resumen por operación no las cuenta
// en noviembre, el de pagos sí.
vi.mock('../api/commercial-partner-commissions.api', () => ({
  getSummaryByBeneficiary: () => Promise.resolve({ socios: [], totalComisiones: 0, totalPagadas: 0, totalPendientes: 0 }),
  getPaidCommissions: () => Promise.resolve({ totalComisiones: 900, totalPagadas: 900, totalPendientes: 0, operaciones: [] }),
}));
vi.mock('@/modules/configuraciones/api/configuraciones.api', () => ({
  getConfiguracionGeneral: () => Promise.resolve({ id: 1, porcentajeComisionOficina: 1.5, horasPendienteAtencion: 4,
    horasPendienteUrgente: 24, horasOperacionDetenida: 48, diaPagoComisiones: 5, updatedAt: '2026-11-04T10:00:00' }),
}));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1, roles: ['GERENTE'] }, hasRole: () => true }) }));

describe('comisiones del Gerente', () => {
  it('"Pagado este mes" suma los pagos hechos en el mes, no las comisiones de operaciones del mes', async () => {
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><CommercialPartnerCommissionsPage /></MemoryRouter></QueryClientProvider>);
    const card = (await screen.findByText('Pagado este mes')).parentElement as HTMLElement;
    expect(await screen.findByText('$900.00')).toBeInTheDocument();
    expect(card).toHaveTextContent('$900.00');
  });

  it('el aviso usa el día de pago configurado', async () => {
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><CommercialPartnerCommissionsPage /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByText(/se pagan por transferencia cada viernes/)).toBeInTheDocument();
  });
});
