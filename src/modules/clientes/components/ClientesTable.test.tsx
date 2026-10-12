import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { ClientesTable } from './ClientesTable';
import type { ClienteResponse } from '../types/clientes.types';

const role = vi.hoisted(() => ({ value: 'SOCIO_COMERCIAL' }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: (roles: string[]) => roles.includes(role.value) }) }));
const client = { id: 27, nombre: 'Cliente de prueba', activo: true } as ClienteResponse;
const handlers = { onEdit: vi.fn(), onActivate: vi.fn(), onDeactivate: vi.fn(), onDelete: vi.fn() };
beforeEach(() => { role.value = 'SOCIO_COMERCIAL'; vi.clearAllMocks(); });

it('muestra dos columnas y mantiene editar y desactivar para el Socio', async () => {
  render(<ClientesTable clientes={[client]} processingClienteId={null} {...handlers} />);
  expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  expect(screen.getByTestId('data-table-mobile')).toHaveTextContent('Cliente de prueba');
  await userEvent.click(screen.getAllByRole('button', { name: 'Opciones de Cliente de prueba' })[0]);
  expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Eliminar definitivamente' })).not.toBeInTheDocument();
});

it('mantiene eliminar para Dirección', async () => {
  role.value = 'DIRECCION';
  render(<ClientesTable clientes={[client]} processingClienteId={null} {...handlers} />);
  await userEvent.click(screen.getAllByRole('button', { name: 'Opciones de Cliente de prueba' })[0]);
  expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toBeInTheDocument();
});
