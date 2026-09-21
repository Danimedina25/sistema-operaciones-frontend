import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChequesPage from './ChequesPage';
import type { Cheque, ChequesPage as ChequesPageData } from './types';

const list = vi.fn();

vi.mock('./api', () => ({
  chequesApi: { list: (...args: unknown[]) => list(...args) },
}));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1 }, hasRole: () => true }),
}));

/** El cajón de gestión tiene sus propias pruebas; aquí sólo interesa que se abra. */
vi.mock('./ChequeManager', () => ({
  ChequeManager: ({ paymentId }: { paymentId: number }) => <div>Cajón del pago {paymentId}</div>,
}));

const cheque = (overrides: Partial<Cheque> = {}): Cheque => ({
  id: 1, pagoId: 77, operacionId: 12, clienteNombre: 'Ariel Ovando', numeroCheque: '00123',
  bancoEmisor: 'Banorte', emisor: 'Emisor SA', beneficiario: 'Operaciones SA', monto: 5000,
  moneda: 'MXN', estado: 'POR_COBRAR', requiereConciliacion: false, version: 1,
  fechaRecepcion: '2026-09-20T10:00:00', cuentaDestinoId: null, cuentaDestinoEtiqueta: null,
  destinoCobro: null, comprobanteUrl: '', historial: [],
  ...overrides,
});

const page = (overrides: Partial<ChequesPageData> = {}): ChequesPageData => ({
  content: [cheque()],
  totalPages: 3,
  totalElements: 47,
  totales: [{ moneda: 'MXN', porCobrar: 5000, depositados: 2000, cobrados: 9000 }],
  ...overrides,
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter><ChequesPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

/** El panel de filtros nace colapsado, como en el resto de las tablas del sistema. */
function openFilters() {
  fireEvent.click(screen.getByRole('button', { name: /mostrar/i }));
}

describe('ChequesPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    list.mockReset().mockResolvedValue(page());
  });

  it('muestra los totales por moneda y el listado', async () => {
    mount();

    expect(await screen.findByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('Por cobrar · MXN')).toBeInTheDocument();
    expect(screen.getByText('Depositados · MXN')).toBeInTheDocument();
    expect(screen.getByText('Cobrados · MXN')).toBeInTheDocument();

    const row = screen.getByText('00123').closest('tr') as HTMLElement;
    expect(within(row).getByText('Banorte')).toBeInTheDocument();
    expect(within(row).getByText('Recibido')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'Operación #12' })).toBeInTheDocument();
  });

  it('marca el cheque histórico como pendiente de conciliar', async () => {
    list.mockResolvedValue(page({ content: [cheque({ estado: null, requiereConciliacion: true })] }));
    mount();

    expect(await screen.findByText('Requiere conciliación')).toBeInTheDocument();
  });

  it('aplica los filtros al enviar el formulario, no al teclear', async () => {
    mount();
    await screen.findByText('00123');
    openFilters();

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Ariel' } });
    // Sigue habiendo una sola consulta: el borrador no dispara la búsqueda.
    expect(list).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ cliente: 'Ariel', page: 0 })));
  });

  it('avisa cuando el rango de fechas está invertido y no consulta', async () => {
    mount();
    await screen.findByText('00123');
    openFilters();

    fireEvent.change(screen.getByLabelText('Recibido desde'), { target: { value: '2026-09-20' } });
    fireEvent.change(screen.getByLabelText('Recibido hasta'), { target: { value: '2026-09-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('no puede ser posterior');
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('pagina desde el backend', async () => {
    mount();
    await screen.findByText('00123');

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
  });

  it('muestra el estado vacío conservando los totales', async () => {
    list.mockResolvedValue(page({ content: [], totalElements: 0, totalPages: 0 }));
    mount();

    expect(await screen.findByText('Sin cheques')).toBeInTheDocument();
    expect(screen.getByText('Por cobrar · MXN')).toBeInTheDocument();
  });

  it('ofrece reintentar cuando la consulta falla', async () => {
    list.mockRejectedValue(new Error('network'));
    mount();

    expect(await screen.findByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('abre el cajón de gestión del cheque elegido', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Ver / gestionar' }));

    expect(await screen.findByText('Cajón del pago 77')).toBeInTheDocument();
  });
});
