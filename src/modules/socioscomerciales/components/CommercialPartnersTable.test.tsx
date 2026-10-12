import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { CommercialPartnersTable } from './CommercialPartnersTable';
import type { CommercialPartnerResponse } from '../types/socioscomerciales.types';

const role = vi.hoisted(() => ({ value: 'SOCIO_COMERCIAL' }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ hasRole: (roles: string[]) => roles.includes(role.value) }) }));
const partner = { id: 1, nombre: 'Socia de prueba', cuentaBancaria: '012345678998', banco: 'BANORTE', titularCuenta: 'Prueba', porcentajeComision: 1.5, activo: true } as CommercialPartnerResponse;
const handlers = { onEdit: vi.fn(), onActivate: vi.fn(), onDeactivate: vi.fn(), onDelete: vi.fn() };
beforeEach(() => { role.value = 'SOCIO_COMERCIAL'; vi.clearAllMocks(); });

it('muestra cuenta enmascarada, porcentaje de formato común y conserva las acciones del Socio', async () => {
  render(<CommercialPartnersTable commercialPartners={[partner]} processingPartnerId={null} {...handlers} />);
  expect(screen.getByRole('table')).toHaveTextContent('BANORTE ••8998');
  expect(screen.getByRole('table')).not.toHaveTextContent('012345678998');
  expect(screen.getByRole('table')).toHaveTextContent('1.5%');
  expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  await userEvent.click(screen.getAllByRole('button', { name: 'Opciones de Socia de prueba' })[0]);
  expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Eliminar definitivamente' })).not.toBeInTheDocument();
  expect(within(screen.getByTestId('data-table-mobile')).getByRole('article')).toHaveTextContent('BANORTE ••8998');
});

it('conserva la eliminación para Dirección', async () => {
  role.value = 'DIRECCION';
  render(<CommercialPartnersTable commercialPartners={[partner]} processingPartnerId={null} {...handlers} />);
  await userEvent.click(screen.getAllByRole('button', { name: 'Opciones de Socia de prueba' })[0]);
  expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toBeInTheDocument();
});
