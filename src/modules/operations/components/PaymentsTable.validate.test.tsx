import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

function mount(onValidatePayment: ValidateHandler, overrides?: Partial<OperationPaymentResponse>, onMarkPaymentInProgress?: (paymentId: number) => Promise<void>, onEditValidationReceipt?: (paymentId: number, file: File) => Promise<void>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PaymentsTable payments={[payment(overrides)]} operationId={12} onValidatePayment={onValidatePayment} onMarkPaymentInProgress={onMarkPaymentInProgress} onEditValidationReceipt={onEditValidationReceipt} />
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

  it('no reabre el panel desde la URL cuando el pago ya fue validado', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const handled = vi.fn();
    render(<QueryClientProvider client={client}><MemoryRouter>
      <PaymentsTable payments={[payment({ estatus: 'VALIDADA' })]} operationId={12} initialReviewPaymentId={44}
        onInitialReviewHandled={handled} onValidatePayment={vi.fn()} />
    </MemoryRouter></QueryClientProvider>);

    await waitFor(() => expect(handled).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

  it('muestra el conteo y el error del desglose dentro del resumen fijo', async () => {
    mount(vi.fn());
    openValidate();
    attachReceipt();
    const summary = screen.getByRole('region', { name: 'Resumen del ingreso' });
    expect(summary).toHaveClass('sticky', 'top-0');
    expect(within(summary).getByText('Total contado $0.00 · faltan $1,200.00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Validar ingreso' }));
    expect(await within(summary).findByRole('alert')).toHaveTextContent('Captura el desglose del efectivo recibido.');

    fireEvent.change(screen.getAllByLabelText('Cantidad de $1,000.00')[0], { target: { value: '1' } });
    fireEvent.change(screen.getAllByLabelText('Cantidad de $100.00')[0], { target: { value: '2' } });
    expect(within(summary).getByText('Total contado $1,200.00 · cuadra')).toBeInTheDocument();
    expect(screen.getAllByText(/Total contado/)).toHaveLength(1);
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

for (const receipt of ['ingreso', 'validación']) it(`abre el comprobante de ${receipt} en el visor sin abrir otra pestaña`, () => {
 mount(vi.fn(), { estatus: 'VALIDADA', comprobanteValidacionUrl: 'https://files/validacion.png' });
 fireEvent.click(screen.getAllByRole('button', { name: 'Más opciones' })[0]);
 fireEvent.click(screen.getByRole('button', { name: `Ver comprobante de ${receipt}` }));
 const dialog = screen.getByRole('dialog', { name: `Comprobante de ${receipt}` });
 const url = receipt === 'ingreso' ? 'https://files/comprobante.jpg' : 'https://files/validacion.png';
 expect(within(dialog).getByRole('img', { name: `Comprobante de ${receipt}` })).toHaveAttribute('src', url);
 expect(within(dialog).queryByRole('link', { name: 'Abrir en otra pestaña' })).not.toBeInTheDocument();
 expect(within(dialog).queryByText('Cambiar comprobante')).not.toBeInTheDocument();
 fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('solo permite reemplazar la validación al consultar ambos comprobantes del mismo pago', () => {
 mount(vi.fn(), { estatus: 'VALIDADA', comprobanteValidacionUrl: 'https://files/validacion.png' }, undefined, vi.fn());
 fireEvent.click(screen.getAllByRole('button', { name: 'Más opciones' })[0]);
 fireEvent.click(screen.getByRole('button', { name: 'Ver comprobante de validación' }));
 expect(screen.getByText('Cambiar comprobante')).toBeInTheDocument();
 fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' }));
 fireEvent.click(screen.getAllByRole('button', { name: 'Más opciones' })[0]);
 fireEvent.click(screen.getByRole('button', { name: 'Ver comprobante de ingreso' }));
 expect(screen.getByRole('dialog', { name: 'Comprobante de ingreso' })).toBeInTheDocument();
 expect(screen.queryByText('Cambiar comprobante')).not.toBeInTheDocument();
});
it('deja la acción principal visible y los comprobantes solo en el menú, sin un "Ver" suelto', () => {
 mount(vi.fn());
 expect(screen.queryByRole('link', { name: 'Ver' })).not.toBeInTheDocument();
 expect(screen.queryByRole('button', { name: 'Ver' })).not.toBeInTheDocument();
 expect(screen.getAllByRole('button', { name: 'Revisar' })[0]).toBeInTheDocument();
 fireEvent.click(screen.getAllByRole('button', { name: 'Más opciones' })[0]);
 expect(screen.getByRole('button', { name: 'Ver comprobante de ingreso' })).toBeInTheDocument();
 // Sin validación todavía no se ofrece su comprobante.
 expect(screen.queryByRole('button', { name: 'Ver comprobante de validación' })).not.toBeInTheDocument();
});
it('abre archivos PDF de ingreso en el mismo visor', () => {
 mount(vi.fn(), { estatus: 'VALIDADA', comprobanteUrl: 'https://files/ingreso.pdf' });
 fireEvent.click(screen.getAllByRole('button', { name: 'Más opciones' })[0]);
 fireEvent.click(screen.getByRole('button', { name: 'Ver comprobante de ingreso' }));
 expect(screen.getByTitle('Comprobante de ingreso')).toHaveAttribute('src', 'https://files/ingreso.pdf');
 expect(screen.queryByRole('button', { name: 'Acercar' })).not.toBeInTheDocument();
});

it('bloquea doble validación y mantiene el error del servidor en la card visible', async () => {
 let fail!: (error: unknown) => void;
 const validate = vi.fn().mockImplementation(() => new Promise((_resolve, reject) => { fail = reject; }));
 mount(validate); openValidate(); attachReceipt();
 fireEvent.change(screen.getByLabelText('Cantidad de $100.00'), { target: { value: '12' } });
 fireEvent.click(screen.getByRole('button', { name: 'Validar ingreso' }));
 expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
 fireEvent.click(screen.getByRole('button', { name: 'Validar ingreso' }));
 expect(validate).toHaveBeenCalledTimes(1);
 fireEvent.keyDown(document, { key: 'Escape' });
 expect(screen.getByRole('dialog')).toBeInTheDocument();
 fail({ isAxiosError: true, response: { data: { message: 'No se pudo validar el pago' } } });
 const summary = await screen.findByRole('region', { name: 'Resumen del ingreso' });
 expect(within(summary).getByRole('alert')).toHaveTextContent('No se pudo validar el pago');
 expect(screen.getByLabelText('Cantidad de $100.00')).toHaveValue(12);
});

describe('Corrección de un pago rechazado', () => {
  function renderRejected(overrides: Partial<OperationPaymentResponse>, onEditPayment = vi.fn()) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter>
      <PaymentsTable payments={[payment({ estatus: 'RECHAZADA', observaciones: 'Comprobante ilegible', ...overrides })]}
        operationId={12} onEditPayment={onEditPayment} />
    </MemoryRouter></QueryClientProvider>);
    return onEditPayment;
  }

  it('ofrece corregir el mismo pago rechazado', () => {
    const onEditPayment = renderRejected({});
    fireEvent.click(screen.getAllByRole('button', { name: 'Corregir pago' })[0]);
    expect(onEditPayment).toHaveBeenCalledWith(44);
    expect(screen.queryByRole('button', { name: 'Editar pago' })).not.toBeInTheDocument();
  });

  it('no ofrece corregir un cheque rechazado, que conserva su propio flujo', () => {
    renderRejected({ tipoPago: 'CHEQUE' });
    expect(screen.queryByRole('button', { name: 'Corregir pago' })).not.toBeInTheDocument();
  });
});
