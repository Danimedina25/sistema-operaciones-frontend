import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { ClientesTable } from './ClientesTable';
import type { ClienteResponse } from '../types/clientes.types';

const client = { id: 27, nombre: 'Cliente de prueba', activo: true } as ClienteResponse;
const handlers = { onEdit: vi.fn(), onActivate: vi.fn(), onDeactivate: vi.fn(), onDelete: vi.fn() };
beforeEach(() => { vi.clearAllMocks(); });

it('muestra dos columnas y permite gestionar solo su red al Socio', async () => {
  render(<ClientesTable clientes={[client]} processingClienteId={null} canEdit canChangeStatus canDelete={false} {...handlers} />);
  expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  expect(screen.getByTestId('data-table-mobile')).toHaveTextContent('Cliente de prueba');
  await userEvent.click(screen.getAllByRole('button', { name: 'Opciones de Cliente de prueba' })[0]);
  expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Eliminar definitivamente' })).not.toBeInTheDocument();
});

it('Dirección consulta sin columna ni menú de acciones', () => {
  render(<ClientesTable clientes={[client]} processingClienteId={null} canEdit={false} canChangeStatus={false} canDelete={false} {...handlers} />);
  expect(screen.getAllByRole('columnheader')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Opciones de Cliente de prueba' })).not.toBeInTheDocument();
});
