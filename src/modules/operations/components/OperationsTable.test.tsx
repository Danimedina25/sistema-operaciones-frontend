import { render, screen } from '@testing-library/react';
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
