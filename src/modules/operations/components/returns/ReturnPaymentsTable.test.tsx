import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReturnPaymentsTable } from './ReturnPaymentsTable';
import type { ReturnPaymentResponse } from '../../types/operations.types.ts';

const auth = vi.hoisted(() => ({ roles: ['SOCIO_COMERCIAL'] as string[] }));
vi.mock('@/modules/auth/store/auth.context.js', () => ({ useAuth: () => ({ user: { userId: 1, roles: auth.roles } }) }));

function request(id: number, tipoPago: string, overrides: Partial<ReturnPaymentResponse> = {}) {
  return { id, tipoPago, monto: 1000, estatus: 'SOLICITADO', fechaSolicitud: '2026-10-27T10:00:00', parcialidades: [],
    numeroParcialidades: 0, montoRetornado: 0, montoDisponible: 1000, ...overrides } as unknown as ReturnPaymentResponse;
}

function mount(returns: ReturnPaymentResponse[], handlers: { open?: () => void; manage?: () => void; edit?: () => void } = {}) {
  render(<ReturnPaymentsTable returns={returns} operationStatus="VALIDADA" montoPendientePorRetornar={1000}
    canEditRequestReturnPayments onOpenReturn={handlers.open} onManageReturn={handlers.manage} onEditReturn={handlers.edit} />);
}

const rowOf = (folio: string) => screen.getAllByText(folio)[0].closest('tr') as HTMLElement;

beforeEach(() => { auth.roles = ['SOCIO_COMERCIAL']; });

describe('acciones de la tabla de retornos', () => {
  it('una solicitud sin trabajo pendiente solo muestra el menú ⋯ con consultar y editar', () => {
    const open = vi.fn(); const edit = vi.fn();
    mount([request(45, 'TRANSFERENCIA')], { open, edit });
    const row = rowOf('#45');
    expect(within(row).queryByRole('button', { name: 'Ver retorno' })).toBeNull();
    expect(within(row).queryByRole('button', { name: 'Editar solicitud' })).toBeNull();

    fireEvent.click(within(row).getByRole('button', { name: 'Más opciones' }));
    fireEvent.click(screen.getByRole('button', { name: /Ver retorno/ }));
    expect(open).toHaveBeenCalled();
    fireEvent.click(within(row).getByRole('button', { name: 'Más opciones' }));
    fireEvent.click(screen.getByRole('button', { name: /Editar solicitud/ }));
    expect(edit).toHaveBeenCalled();
  });

  it('el retiro sin tarjeta deja visible su acción de trabajo y lo demás en el menú', () => {
    const manage = vi.fn();
    mount([request(46, 'RETIRO_SIN_TARJETA')], { manage });
    const row = rowOf('#46');
    fireEvent.click(within(row).getByRole('button', { name: 'Ver códigos de retiro' }));
    expect(manage).toHaveBeenCalled();
    expect(within(row).queryByRole('button', { name: 'Editar solicitud' })).toBeNull();
    fireEvent.click(within(row).getByRole('button', { name: 'Más opciones' }));
    expect(screen.getByRole('button', { name: /Editar solicitud/ })).toBeInTheDocument();
  });
});
