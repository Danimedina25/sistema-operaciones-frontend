import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { SearchFilterBar } from './SearchFilterBar';

it('mantiene visible la búsqueda y permite abrir, quitar y aplicar filtros', async () => {
  const onSearchChange = vi.fn();
  const onRemove = vi.fn();
  render(<SearchFilterBar search="" onSearchChange={onSearchChange} filters={<label>Banco<select><option>Todos</option></select></label>} activeFilters={[{ key: 'bank', label: 'Banco: BANORTE', onRemove }]} />);
  expect(screen.getByRole('searchbox', { name: 'Buscar' })).toBeInTheDocument();
  expect(screen.queryByText('Banco', { selector: 'label' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Filtros/ }));
  expect(screen.getByText('Banco', { selector: 'label' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Quitar filtro Banco: BANORTE' }));
  expect(onRemove).toHaveBeenCalledOnce();
  await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar' }), '42');
  expect(onSearchChange).toHaveBeenCalled();
});
