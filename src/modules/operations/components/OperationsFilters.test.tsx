import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { OperationsFilters } from './OperationsFilters';
import type { OperationsFilters as Filters } from '../types/operations.types.ts';

it('muestra ocho estatus y vuelve a todos al desmarcar el seleccionado', async () => {
  function Harness() {
    const [filters, setFilters] = useState<Filters>({
      operationId: 0, search: '', status: 'ALL', dateFilter: 'THIS_MONTH',
      startDate: '', endDate: '', activo: 'ACTIVE', paymentTypes: '', paymentStatus: '',
      returnStatuses: '', cuentaDestinoId: 0, banco: '', socioComercialId: 0,
    });
    return <><OperationsFilters filters={filters} onChange={setFilters} /><output>{filters.status}</output></>;
  }
  render(<Harness />);
  const group = within(screen.getByRole('group', { name: 'Estatus de la operación' }));
  expect(group.getAllByRole('button')).toHaveLength(8);
  expect(group.queryByRole('button', { name: 'Todos' })).not.toBeInTheDocument();
  expect(group.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  await userEvent.click(group.getByRole('button', { name: 'Validada' }));
  expect(screen.getByRole('status')).toHaveTextContent('VALIDADA');
  await userEvent.click(group.getByRole('button', { name: 'Finalizado' }));
  expect(screen.getByRole('status')).toHaveTextContent('RETORNADA');
  expect(group.getAllByRole('button', { pressed: true })).toHaveLength(1);
  await userEvent.click(group.getByRole('button', { name: 'Finalizado' }));
  expect(screen.getByRole('status')).toHaveTextContent('ALL');
  expect(group.queryAllByRole('button', { pressed: true })).toHaveLength(0);
});
