import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BankCombobox } from './BankCombobox';

/** Controlado, como lo usan los formularios reales. */
function Harness({ initial = '', onSubmit }: { initial?: string; onSubmit?: () => void }) {
  const [bank, setBank] = useState(initial);
  return (
    <form onSubmit={event => { event.preventDefault(); onSubmit?.(); }}>
      <BankCombobox label="Banco" value={bank} onChange={setBank} />
      <output>valor: {bank}</output>
    </form>
  );
}

const input = () => screen.getByRole('combobox', { name: /Banco/ });

describe('BankCombobox', () => {
  it('sugiere el catálogo al enfocar', () => {
    render(<Harness />);
    fireEvent.focus(input());

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'BANORTE' })).toBeInTheDocument();
  });

  it('filtra las sugerencias con lo que se escribe, sin distinguir acentos', () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: 'fundacion' } });

    expect(screen.getByRole('option', { name: 'FUNDACIÓN DONDÉ' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'BANORTE' })).toBeNull();
  });

  it('elegir una sugerencia la captura', () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: 'bano' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: 'BANORTE' }));

    expect(input()).toHaveValue('BANORTE');
    expect(screen.getByText('valor: BANORTE')).toBeInTheDocument();
  });

  it('admite un banco que no está en el catálogo', () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: 'Banco Regional del Sur' } });

    expect(screen.getByText(/Puedes capturarlo de todos modos/)).toBeInTheDocument();
    expect(input()).toHaveValue('Banco Regional del Sur');
  });

  it('normaliza al salir para que el filtro agrupe los mismos bancos', () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: '  banorte ' } });
    fireEvent.blur(input());

    expect(screen.getByText('valor: BANORTE')).toBeInTheDocument();
  });

  it('se recorre con las flechas y Enter elige sin enviar el formulario', () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    fireEvent.change(input(), { target: { value: 'ban' } });
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    fireEvent.keyDown(input(), { key: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
    // La primera coincidencia de "ban" en el catálogo, ya capturada y la lista cerrada.
    expect(input()).toHaveValue('BANCO DEL BIENESTAR');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Escape cierra la lista sin borrar lo escrito', () => {
    render(<Harness />);
    fireEvent.change(input(), { target: { value: 'ban' } });
    fireEvent.keyDown(input(), { key: 'Escape' });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input()).toHaveValue('ban');
  });
});
