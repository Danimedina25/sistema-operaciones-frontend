import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { BankAccountCombobox } from './BankAccountCombobox';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';

const accounts: BankAccountResponse[] = [
  { id: 1, banco: 'BBVA', titular: 'Alfa', numeroCuenta: '00011112222', clabe: '012345678901234567', activo: true, createdAt: '', updatedAt: '' },
  { id: 2, banco: 'Banorte', titular: 'Beta', numeroCuenta: '00033334444', clabe: '072345678901234567', activo: true, createdAt: '', updatedAt: '' },
  { id: 3, banco: 'Bajío', titular: 'Gamma', numeroCuenta: '00055556666', clabe: '030345678901234567', activo: false, createdAt: '', updatedAt: '' },
];

type HarnessProps = Partial<Omit<React.ComponentProps<typeof BankAccountCombobox>, 'value'>>;

/** Envoltura con estado: el combobox es controlado, así que la prueba debe sostener el valor. */
function Harness({ onChange, ...rest }: HarnessProps = {}) {
  const [value, setValue] = useState<number | null>(null);
  return (
    <BankAccountCombobox
      label="Cuenta bancaria"
      accounts={accounts}
      {...rest}
      value={value}
      onChange={next => { setValue(next); onChange?.(next); }}
    />
  );
}

function combobox() {
  return screen.getByRole('combobox', { name: 'Cuenta bancaria' });
}

describe('BankAccountCombobox', () => {
  it('declara el contrato ARIA del patrón combobox', () => {
    render(<Harness />);
    const input = combobox();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).not.toHaveAttribute('aria-activedescendant');

    fireEvent.focus(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toHaveAttribute('id', input.getAttribute('aria-controls'));

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const active = input.getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active as string)).toHaveAttribute('aria-selected', 'false');
  });

  it('navega con las flechas, envuelve en los extremos y selecciona con Enter', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = combobox();
    fireEvent.focus(input);

    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Alfa
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Beta
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(2);

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // envuelve al último activo
    fireEvent.keyDown(input, { key: 'Home' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('End salta a la última opción', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} onlyActive={false} />);
    const input = combobox();
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'End' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('Escape cierra sin seleccionar y restaura la etiqueta elegida', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = combobox();
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('Alfa — BBVA — 00011112222');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Beta' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('Alfa — BBVA — 00011112222');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('Enter no envía el formulario que lo contiene', () => {
    const onSubmit = vi.fn(event => event.preventDefault());
    render(<form onSubmit={onSubmit}><Harness /></form>);
    const input = combobox();
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('se cierra al hacer clic fuera', () => {
    render(<div><Harness /><button type="button">fuera</button></div>);
    fireEvent.focus(combobox());
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('button', { name: 'fuera' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('filtra sin acentos y por número de cuenta', () => {
    render(<Harness onlyActive={false} />);
    const input = combobox();
    fireEvent.focus(input);

    fireEvent.change(input, { target: { value: 'bajio' } });
    expect(screen.getByRole('option', { name: /Gamma/ })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '3333 4444' } });
    expect(screen.getByRole('option', { name: /Beta/ })).toBeInTheDocument();
  });

  it('oculta las cuentas inactivas salvo que se pidan explícitamente', () => {
    const { unmount } = render(<Harness />);
    fireEvent.focus(combobox());
    expect(screen.queryByRole('option', { name: /Gamma/ })).not.toBeInTheDocument();
    unmount();

    render(<Harness onlyActive={false} />);
    fireEvent.focus(combobox());
    expect(screen.getByRole('option', { name: /Gamma/ })).toHaveTextContent('inactiva');
  });

  it('muestra los estados de carga, error y sin resultados', () => {
    const { unmount } = render(<Harness isLoading />);
    fireEvent.focus(combobox());
    expect(screen.getByText('Cargando cuentas…')).toBeInTheDocument();
    unmount();

    const errorView = render(<Harness loadError="No se pudieron cargar las cuentas" />);
    fireEvent.focus(combobox());
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las cuentas');
    errorView.unmount();

    render(<Harness />);
    const input = combobox();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zzzz' } });
    expect(screen.getByText('No se encontraron cuentas')).toBeInTheDocument();
  });

  it('nunca muestra el número completo dentro de la lista', () => {
    render(<Harness />);
    fireEvent.focus(combobox());
    const option = screen.getByRole('option', { name: /Alfa/ });
    expect(option).toHaveTextContent('••••2222');
    expect(option).not.toHaveTextContent('00011112222');
  });

  it('expone el error de validación al lector de pantalla', () => {
    render(<Harness fieldError="Selecciona la cuenta bancaria" />);
    const input = combobox();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById(input.getAttribute('aria-describedby') as string))
      .toHaveTextContent('Selecciona la cuenta bancaria');
  });
});
