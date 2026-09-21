import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClienteCombobox, type ClienteOption } from './ClienteCombobox';

const searchClientes = vi.fn();

vi.mock('@/modules/clientes/api/clientes.api', () => ({
  searchClientes: (...args: unknown[]) => searchClientes(...args),
}));

const cargados: ClienteOption[] = [
  { id: 1, label: 'Ariel Ovando' },
  { id: 2, label: 'Beatriz Nuñez' },
];

function Harness({ onSelect = vi.fn() }: { onSelect?: (c: ClienteOption) => void }) {
  const [search, setSearch] = useState('');
  return (
    <ClienteCombobox
      clientes={cargados}
      search={search}
      onSearchChange={setSearch}
      onSelect={cliente => { setSearch(cliente.label); onSelect(cliente); }}
    />
  );
}

const input = () => screen.getByRole('combobox', { name: /Cliente/ });

describe('ClienteCombobox', () => {
  beforeEach(() => {
    vi.useRealTimers();
    searchClientes.mockReset().mockResolvedValue([]);
  });

  it('filtra primero entre los clientes ya cargados, sin consultar el catálogo', async () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: 'ariel' } });

    expect(screen.getByRole('option', { name: 'Ariel Ovando' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Beatriz Nuñez' })).toBeNull();
    expect(searchClientes).not.toHaveBeenCalled();
  });

  it('elegir un cliente lo entrega al formulario', () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    fireEvent.change(input(), { target: { value: 'ariel' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Ariel Ovando' }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(input()).toHaveValue('Ariel Ovando');
  });

  it('sólo consulta el catálogo cuando lo cargado no alcanza', async () => {
    searchClientes.mockResolvedValue([{ id: 9, nombre: 'Carlos Pérez', nivelesRedComercial: 2 }]);
    render(<Harness />);

    fireEvent.change(input(), { target: { value: 'carlos' } });
    expect(screen.getByText(/Buscando en clientes de otros socios/)).toBeInTheDocument();

    await waitFor(() => expect(searchClientes).toHaveBeenCalledWith('carlos'));
    expect(await screen.findByRole('option', { name: 'Carlos Pérez' })).toBeInTheDocument();
    expect(screen.getByText('Clientes de otros socios comerciales')).toBeInTheDocument();
  });

  it('no consulta el catálogo con menos de dos letras', async () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: 'z' } });

    await new Promise(resolve => setTimeout(resolve, 350));
    expect(searchClientes).not.toHaveBeenCalled();
  });

  it('se recorre con flechas y Enter elige sin enviar el formulario', () => {
    const onSubmit = vi.fn();
    render(<form onSubmit={event => { event.preventDefault(); onSubmit(); }}><Harness /></form>);

    fireEvent.change(input(), { target: { value: 'nu' } });
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    fireEvent.keyDown(input(), { key: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(input()).toHaveValue('Beatriz Nuñez');
  });
});
