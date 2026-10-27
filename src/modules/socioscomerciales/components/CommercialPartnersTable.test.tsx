import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { CommercialPartnersTable } from './CommercialPartnersTable';
import type { CommercialPartnerResponse } from '../types/socioscomerciales.types';

const partner = { id: 1, nombre: 'Socia de prueba', cuentaBancaria: '012345678998', banco: 'BANORTE', titularCuenta: 'Prueba', porcentajeComision: 1.5, commissionConfigured: true, socioComercialId: 3, socioComercialNombre: 'Socio propietario', activo: true } as CommercialPartnerResponse;
const handlers = { onEdit: vi.fn(), onActivate: vi.fn(), onDeactivate: vi.fn(), onDelete: vi.fn() };
beforeEach(() => { vi.clearAllMocks(); });

it('muestra cuenta enmascarada, porcentaje de formato común y conserva las acciones del Socio', async () => {
  render(<CommercialPartnersTable commercialPartners={[partner]} processingPartnerId={null} canEdit canChangeStatus canDelete={false} {...handlers} />);
  expect(screen.getByRole('table')).toHaveTextContent('BANORTE ••8998');
  expect(screen.getByRole('table')).not.toHaveTextContent('012345678998');
  expect(screen.getByRole('table')).toHaveTextContent('1.5%');
  expect(screen.getByRole('table')).toHaveTextContent('Socio propietario');
  expect(screen.getAllByRole('columnheader')).toHaveLength(5);
  await userEvent.click(screen.getAllByRole('button', { name: 'Opciones de Socia de prueba' })[0]);
  expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Eliminar definitivamente' })).not.toBeInTheDocument();
  expect(within(screen.getByTestId('data-table-mobile')).getByRole('article')).toHaveTextContent('BANORTE ••8998');
});

it('Dirección consulta sin columna ni menú de acciones', () => {
  render(<CommercialPartnersTable commercialPartners={[partner]} processingPartnerId={null} canEdit={false} canChangeStatus={false} canDelete={false} {...handlers} />);
  expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  expect(screen.queryByRole('button', { name: 'Opciones de Socia de prueba' })).not.toBeInTheDocument();
});

it('otro Socio puede consultar el socio secundario sin editarlo', () => {
  render(<CommercialPartnersTable commercialPartners={[partner]} processingPartnerId={null} canEdit canChangeStatus canDelete={false} editableOwnerId={9} {...handlers} />);
  expect(screen.getByRole('table')).toHaveTextContent('Socia de prueba');
  expect(screen.queryByRole('button', { name: 'Opciones de Socia de prueba' })).not.toBeInTheDocument();
});
