import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { PaymentsTable } from './PaymentsTable';
import { emptyCounts } from '@/modules/caja-general/utils/cash-amounts';
import type { OperationPaymentResponse } from '../types/operations.types.ts';
import type { CashCounts } from '@/modules/caja-general/types/caja-general.types';

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({ user: { userId: 1, roles: ['ADMIN'] }, hasRole: () => true }),
}));

function payment(overrides: Partial<OperationPaymentResponse> = {}): OperationPaymentResponse {
  return {
    id: 44, monto: 1200, tipoPago: 'EFECTIVO',
    comprobanteUrl: 'https://files/comprobante.jpg', comprobanteValidacionUrl: '',
    cuentaDestinoId: 0, cuentaDestinoBanco: '', cuentaDestinoTitular: '',
    estatus: 'PENDIENTE_VALIDACION', observaciones: null,
    registradoPorId: 1, registradoPorNombre: 'Socio',
    validadoPorId: null, validadoPorNombre: null,
    enProcesoPorId: null, enProcesoPorNombre: null, fechaEnProceso: null,
    fechaPago: '2026-09-17T09:00:00', fechaValidacion: null, fechaComprobante: '2026-09-17T09:00:00',
    createdAt: '2026-09-17T09:00:00', updatedAt: '2026-09-17T09:00:00',
    ...overrides,
  };
}

type ValidateHandler = (paymentId: number, comprobante: File, denominaciones?: CashCounts) => Promise<void> | void;

function mount(onValidatePayment: ValidateHandler, overrides?: Partial<OperationPaymentResponse>, onMarkPaymentInProgress?: (paymentId: number) => Promise<void>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PaymentsTable payments={[payment(overrides)]} operationId={12} onValidatePayment={onValidatePayment} onMarkPaymentInProgress={onMarkPaymentInProgress} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/**
 * Abre el panel de revisión. Todos los pagos validables entran directamente
 * al formulario de validación.
 */
function openValidate() {
  fireEvent.click(screen.getAllByRole('button', { name: /revisar/i })[0]);
  const selectValidate = screen.queryAllByRole('button', { name: /^Validar$/ })[0];
  if (selectValidate) fireEvent.click(selectValidate);
}

function attachReceipt() {
  const file = new File(['x'], 'validacion.jpg', { type: 'image/jpeg' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

describe('Validación de un pago en efectivo', () => {
  it('abre el panel sin duplicar la tabla al usarlo desde Entradas', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter>
      <PaymentsTable reviewOnly payments={[payment()]} operationId={12} initialReviewPaymentId={44} onValidatePayment={vi.fn()} />
    </MemoryRouter></QueryClientProvider>);

    expect(await screen.findByRole('dialog', { name: /efectivo/i })).toBeInTheDocument();
    expect(screen.queryByText('Pagos y comprobantes')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validar ingreso' })).toBeInTheDocument();
  });

  it('pide el desglose del efectivo recibido', () => {
    mount(vi.fn());
    openValidate();

    expect(screen.getByText('Cuenta el efectivo recibido')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Cantidad de $1,000.00')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
  });

  it('exige que el desglose sume exactamente el importe del pago', async () => {
    const onValidatePayment = vi.fn().mockResolvedValue(undefined);
    mount(onValidatePayment);
    openValidate();
    attachReceipt();

    // Sin desglose.
    fireEvent.click(screen.getByRole('button', { name: 'Validar ingreso' }));
    expect((await screen.findAllByText('Captura el desglose del efectivo recibido.'))[0]).toBeInTheDocument();
    expect(onValidatePayment).not.toHaveBeenCalled();

    // Desglose que no cuadra: $1,000 contra un pago de $1,200.
    fireEvent.change(screen.getAllByLabelText('Cantidad de $1,000.00')[0], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validar ingreso' }));
    expect((await screen.findAllByText('El desglose debe sumar exactamente el importe del pago.'))[0]).toBeInTheDocument();
    expect(onValidatePayment).not.toHaveBeenCalled();

    // Cuadrado: $1,000 + 2 × $100.
    fireEvent.change(screen.getAllByLabelText('Cantidad de $100.00')[0], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validar ingreso' }));

    await waitFor(() => expect(onValidatePayment).toHaveBeenCalledWith(
      44,
      expect.any(File),
      { ...emptyCounts(), D1000: 1, D100: 2 },
    ));
  });

  it('no pide desglose cuando el pago no es en efectivo', async () => {
    const onValidatePayment = vi.fn().mockResolvedValue(undefined);
    mount(onValidatePayment, { tipoPago: 'TRANSFERENCIA' });
    openValidate();

    expect(screen.queryByText('Cuenta el efectivo recibido')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Cantidad de $1,000.00')).not.toBeInTheDocument();

    attachReceipt();
    fireEvent.click(screen.getByRole('button', { name: 'Validar ingreso' }));

    // El tercer argumento va vacío: ese pago no toca Caja General.
    await waitFor(() => expect(onValidatePayment).toHaveBeenCalledWith(44, expect.any(File), undefined));
  });

  it('conserva Marcar en proceso en el panel bancario', async () => {
    const onMark = vi.fn().mockResolvedValue(undefined);
    mount(vi.fn(), { tipoPago: 'TRANSFERENCIA' }, onMark);
    openValidate();

    expect(screen.getByRole('button', { name: 'Validar ingreso' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar en proceso' }));
    await waitFor(() => expect(onMark).toHaveBeenCalledWith(44));
  });

  it('sigue exigiendo el comprobante de validación', () => {
    const onValidatePayment = vi.fn();
    mount(onValidatePayment);
    openValidate();

    fireEvent.change(screen.getAllByLabelText('Cantidad de $1,000.00')[0], { target: { value: '1' } });
    fireEvent.change(screen.getAllByLabelText('Cantidad de $100.00')[0], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validar ingreso' }));

    expect(screen.getAllByText('El comprobante de validación es obligatorio.')[0]).toBeInTheDocument();
    expect(onValidatePayment).not.toHaveBeenCalled();
  });
});

describe('Cheques recibidos', () => {
  it('se gestionan desde Acciones con el mismo botón Revisar', async () => {
    const validate = vi.fn();
    mount(validate, { tipoPago: 'CHEQUE', cuentaDestinoId: null, chequeEstado: 'POR_COBRAR' });

    // El estado sigue informándose en la columna Tipo…
    expect(screen.getAllByText('Recibido').length).toBeGreaterThan(0);
    // …pero ya no hay un botón suelto ahí.
    expect(screen.queryByRole('button', { name: 'Gestionar cheque' })).not.toBeInTheDocument();

    // La acción vive en Acciones y se llama igual que las de los demás pagos.
    const revisar = screen.getAllByRole('button', { name: 'Revisar' });
    expect(revisar.length).toBeGreaterThan(0);

    fireEvent.click(revisar[0]);

    // Abre la gestión del cheque, no el panel genérico de validación.
    expect(await screen.findByRole('dialog', { name: 'Gestionar cheque' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Validar' })).not.toBeInTheDocument();
    expect(validate).not.toHaveBeenCalled();
  });
});
