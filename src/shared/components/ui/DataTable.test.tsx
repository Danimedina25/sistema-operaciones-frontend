import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable, type DataTableColumn } from './DataTable';

type Row = { id: number; client: string; status: string };
const rows: Row[] = [{ id: 42, client: 'Cliente Demo', status: 'Pendiente' }];
const columns: DataTableColumn<Row>[] = [
  { key: 'client', header: 'Cliente', cell: (row) => row.client },
  { key: 'status', header: 'Estatus', cell: (row) => row.status, kind: 'status' },
  { key: 'actions', header: 'Acciones', cell: () => 'Ver detalle', kind: 'actions' },
];
const mobile = {
  title: (row: Row) => row.client,
  status: (row: Row) => row.status,
  fields: [{ key: 'folio', label: 'Folio', value: (row: Row) => row.id }],
  actions: () => <button type="button">Ver detalle</button>,
};

describe('DataTable', () => {
  it('limita a siete columnas', () => {
    const eight = Array.from({ length: 8 }, (_, index) => ({ key: String(index), header: String(index), cell: () => index }));
    expect(() => render(<DataTable columns={eight} rows={rows} getRowKey={(row) => row.id} mobile={mobile} emptyTitle="Sin datos" />)).toThrow('máximo de 7 columnas');
  });

  it('renderiza tarjetas móviles con información y acciones, sin contenedor de scroll horizontal', () => {
    const { container } = render(<DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} mobile={mobile} emptyTitle="Sin datos" />);
    const mobileRegion = screen.getByTestId('data-table-mobile');
    expect(mobileRegion).toHaveClass('responsive-data-table__cards');
    expect(screen.getByRole('table').parentElement).toHaveClass('responsive-data-table__table');
    expect(container.querySelector('.responsive-data-table')).toBeInTheDocument();
    expect(within(mobileRegion).getByRole('article')).toHaveTextContent('Cliente Demo');
    expect(within(mobileRegion).getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument();
    expect(container.querySelector('.overflow-x-auto')).toBeNull();
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  });

  it('puede compactar los campos móviles y ocultar los que no aplican a la fila', () => {
    render(<DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} emptyTitle="Sin datos" mobileFieldsLayout="rows" mobile={{ ...mobile, fields: [
      { key: 'folio', label: 'Folio', value: (row) => row.id },
      { key: 'validated', label: 'Validado por', value: () => 'Cuentas', visible: (row) => row.status === 'Validado' },
    ] }} />);
    const card = within(screen.getByTestId('data-table-mobile')).getByRole('article');
    expect(card).toHaveTextContent('Folio');
    expect(card).not.toHaveTextContent('Validado por');
    expect(card.querySelector('dl')).toHaveClass('space-y-1.5');
  });

  it('muestra un mensaje específico cuando no hay filas', () => {
    render(<DataTable columns={columns} rows={[]} getRowKey={(row) => row.id} mobile={mobile} emptyTitle="No hay retornos por pagar" emptyDescription="Aparecerán cuando un socio los solicite." />);
    expect(screen.getByText('No hay retornos por pagar')).toBeInTheDocument();
    expect(screen.getByText('Aparecerán cuando un socio los solicite.')).toBeInTheDocument();
  });

  it('puede conservar el encabezado de columnas en el estado vacío', () => {
    render(<DataTable columns={columns} rows={[]} getRowKey={(row) => row.id} mobile={mobile} emptyTitle="No hay retornos" showHeaderWhenEmpty />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getByText('No hay retornos')).toBeInTheDocument();
  });
});
