import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationsTable } from './OperationsTable';
import type { OperationStatus, PaymentOperationResponse } from '../types/operations.types.ts';
import type { RoleName } from '@/modules/auth/types/auth.types';

const mocks = vi.hoisted(() => ({ roles: ['ADMIN'] as string[] }));

vi.mock('@/modules/auth/store/auth.context', () => ({
  useAuth: () => ({
    user: { userId: 1, roles: mocks.roles },
    hasRole: (roles: RoleName | readonly RoleName[]) =>
      (Array.isArray(roles) ? roles : [roles]).some((role) => mocks.roles.includes(role)),
  }),
}));

function buildOperation(estatus: OperationStatus): PaymentOperationResponse {
  return {
    id: 42,
    activo: true,
    clienteId: 1,
    clienteNombre: 'Cliente Demo',
    montoTotal: 10000,
    montoValidado: 0,
    montoRegistrado: 0,
    saldoPendientePorValidar: 10000,
    saldoPendientePorRegistrar: 10000,
    estatus,
    socioComercialId: 1,
    socioComercialNombre: 'Socio Demo',
    nivelesRedComercial: 1,
    porcentajeComisionSocio: 1,
    porcentajeComisionOficina: 1,
    montoComisionSocioNivel1: 0,
    montoComisionSocioNivel2: 0,
    montoComisionSocioNivel3: 0,
    porcentajeComisionRedTotal: 1,
    montoComisionRedTotal: 0,
    porcentajeComisionOficinaTotal: 1,
    montoComisionOficinaTotal: 0,
    porcentajeComisionTotal: 2,
    montoComisionTotal: 0,
    montoTotalDevolverCliente: 0,
    montoSolicitadoRetorno: 0,
    saldoPendientePorSolicitar: 0,
    montoRetornado: 0,
    saldoPendienteRetornar: 0,
    numeroRetornosSolicitados: 0,
    pagos: [],
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    contieneRetornosEnEfectivo: false,
    contieneRetornosRetiroSinTarjeta: false,
    contieneRetornosEnTransferencia: false,
  } as PaymentOperationResponse;
}

async function renderTableAndOpenMenu(
  roles: string[],
  estatus: OperationStatus = 'PENDIENTE_VALIDACION',
  onDeleteOperation = vi.fn(),
) {
  mocks.roles = roles;

  render(
    <OperationsTable
      operations={[buildOperation(estatus)]}
      currentPage={0}
      totalPages={1}
      totalElements={1}
      onPageChange={vi.fn()}
      onViewDetail={vi.fn()}
      onAddPayment={vi.fn()}
      onDeleteOperation={onDeleteOperation}
    />,
  );

  // El menú de acciones se renderiza para escritorio y para móvil.
  await userEvent.click(screen.getAllByRole('button', { name: /acciones|más/i })[0]);
  return onDeleteOperation;
}

beforeEach(() => {
  mocks.roles = ['ADMIN'];
  vi.clearAllMocks();
});

describe('acción de eliminar operación', () => {
  it.each([['ADMIN'], ['GERENTE']])(
    'se ofrece a %s sobre una operación pendiente de validación',
    async (role) => {
      await renderTableAndOpenMenu([role]);

      expect(
        screen.getByRole('button', { name: 'Eliminar definitivamente' }),
      ).toBeInTheDocument();
    },
  );

  it.each([['DIRECCION'], ['SOCIO_COMERCIAL'], ['JEFA_CAJAS'], ['JEFA_CUENTAS'], ['AUXILIAR_CUENTAS']])(
    'no se ofrece a %s',
    async (role) => {
      await renderTableAndOpenMenu([role]);

      expect(
        screen.queryByRole('button', { name: 'Eliminar definitivamente' }),
      ).not.toBeInTheDocument();
    },
  );

  it.each([['INGRESO_PARCIAL'], ['VALIDADA'], ['RECHAZADA'], ['RETORNADA'], ['COMPLETADA']])(
    'no se ofrece a ADMIN cuando la operación está en %s',
    async (estatus) => {
      await renderTableAndOpenMenu(['ADMIN'], estatus as OperationStatus);

      expect(
        screen.queryByRole('button', { name: 'Eliminar definitivamente' }),
      ).not.toBeInTheDocument();
    },
  );

  it('entrega la operación completa al confirmar la acción', async () => {
    const onDeleteOperation = await renderTableAndOpenMenu(['ADMIN']);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    expect(onDeleteOperation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42, clienteNombre: 'Cliente Demo' }),
    );
  });
});

describe('listado compartido de operaciones', () => {
  it('usa Ver neutral y de tamaño normal en tabla y tarjetas', async () => {
    const onViewDetail = vi.fn();
    render(<OperationsTable operations={[buildOperation('VALIDADA')]} currentPage={0} totalPages={1} totalElements={1} onPageChange={vi.fn()} onViewDetail={onViewDetail} onAddPayment={vi.fn()} />);
    const tableButton = within(screen.getByRole('table')).getByRole('button', { name: 'Ver' });
    const cardButton = within(screen.getByTestId('data-table-mobile')).getByRole('button', { name: 'Ver' });
    for (const button of [tableButton, cardButton]) {
      expect(button).toHaveClass('bg-surface', 'border-border-strong', 'h-11');
      expect(button).not.toHaveClass('flex-1', 'w-full');
      await userEvent.click(button);
    }
    expect(onViewDetail).toHaveBeenNthCalledWith(1, 42);
    expect(onViewDetail).toHaveBeenNthCalledWith(2, 42);
    expect(within(screen.getByTestId('data-table-mobile')).getByRole('button', { name: 'Más opciones' })).toBeInTheDocument();
  });

  it('mantiene Acciones visible en la columna fija y conserva el menú de permisos', async () => {
    render(<OperationsTable operations={[buildOperation('PENDIENTE_VALIDACION')]} currentPage={0} totalPages={1} totalElements={1} onPageChange={vi.fn()} onViewDetail={vi.fn()} onAddPayment={vi.fn()} />);
    const table = screen.getByRole('table');
    const actionsHeader = within(table).getByRole('columnheader', { name: 'Acciones' });
    expect(table).toHaveClass('table-fixed');
    expect(actionsHeader).toHaveTextContent('Acciones');
    expect(within(table).getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    await userEvent.click(within(table).getByRole('button', { name: 'Más opciones' }));
    expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toBeInTheDocument();
  });

  it('muestra ingreso validado en una sola línea y el desglose en el tooltip', () => {
    render(<OperationsTable operations={[buildOperation('VALIDADA')]} currentPage={0} totalPages={1} totalElements={1} onPageChange={vi.fn()} onViewDetail={vi.fn()} onAddPayment={vi.fn()} />);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(within(table).getByTitle(/Validado:.*Registrado:/)).toBeInTheDocument();
    expect(within(table).getByText('0%')).toBeInTheDocument();
    expect(within(table).getByText('Validada')).toHaveClass('whitespace-nowrap');
  });
  it.each([
    [false, ['Folio', 'Cliente', 'Creada', 'Monto', 'Ingreso validado', 'Estatus', 'Acciones']],
    [true, ['Folio', 'Cliente', 'Último cambio', 'Monto', 'Estatus', 'Sin avanzar', 'Acciones']],
  ])('muestra siete columnas en la vista detenidas=%s', (stalledView, headers) => {
    render(<OperationsTable operations={[buildOperation('VALIDADA')]} currentPage={0} totalPages={1} totalElements={1} onPageChange={vi.fn()} onViewDetail={vi.fn()} onAddPayment={vi.fn()} stalledView={stalledView} />);
    expect(within(screen.getByRole('table')).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(headers);
  });

  it.each([
    ['SOCIO_COMERCIAL', false], ['JEFA_CAJAS', true], ['JEFA_CUENTAS', true],
    ['AUXILIAR_CUENTAS', true], ['GERENTE', true], ['DIRECCION', true], ['ADMIN', true],
  ])('muestra el socio bajo el cliente solo a roles con varias operaciones: %s', (role, showPartner) => {
    mocks.roles = [role];
    render(<OperationsTable operations={[buildOperation('VALIDADA')]} currentPage={0} totalPages={1} totalElements={1} onPageChange={vi.fn()} onViewDetail={vi.fn()} onAddPayment={vi.fn()} />);
    expect(screen.queryAllByText('Socio: Socio Demo').length > 0).toBe(showPartner);
  });

  it.each([
    ['SOCIO_COMERCIAL', ['Ver detalle', 'Registrar pago de ingreso', 'Editar'], ['Validar pagos de ingreso', 'Desactivar', 'Eliminar definitivamente']],
    ['JEFA_CAJAS', ['Ver detalle', 'Validar pagos de ingreso'], ['Registrar pago de ingreso', 'Editar', 'Desactivar', 'Eliminar definitivamente']],
    ['JEFA_CUENTAS', ['Ver detalle', 'Validar pagos de ingreso'], ['Registrar pago de ingreso', 'Editar', 'Desactivar', 'Eliminar definitivamente']],
    ['AUXILIAR_CUENTAS', ['Ver detalle', 'Validar pagos de ingreso'], ['Registrar pago de ingreso', 'Editar', 'Desactivar', 'Eliminar definitivamente']],
    ['GERENTE', ['Ver detalle', 'Validar pagos de ingreso', 'Registrar pago de ingreso', 'Editar', 'Desactivar', 'Eliminar definitivamente'], []],
    ['DIRECCION', ['Ver detalle', 'Validar pagos de ingreso', 'Registrar pago de ingreso', 'Editar', 'Desactivar'], ['Eliminar definitivamente']],
    ['ADMIN', ['Ver detalle', 'Validar pagos de ingreso', 'Registrar pago de ingreso', 'Editar', 'Desactivar', 'Eliminar definitivamente'], []],
  ])('conserva las acciones del rol %s', async (role, expected, absent) => {
    await renderTableAndOpenMenu([role]);
    for (const label of expected) expect(screen.getAllByRole('button', { name: label }).length).toBeGreaterThan(0);
    for (const label of absent) expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
  });
});
