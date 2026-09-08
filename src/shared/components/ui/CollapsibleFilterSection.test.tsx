import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CollapsibleFilterSection } from './CollapsibleFilterSection';

describe('CollapsibleFilterSection', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('restaura abierto y cerrado al volver a montar sin mezclar usuarios', async () => {
    const user = userEvent.setup();
    const section = (storageKey: string) => (
      <CollapsibleFilterSection storageKey={storageKey}>Filtros</CollapsibleFilterSection>
    );
    const first = render(section('operations:1'));
    expect(window.sessionStorage.getItem('operations:1')).toBeNull();
    await user.click(screen.getByRole('button', { name: /mostrar/i }));
    first.unmount();

    const reopened = render(section('operations:1'));
    expect(screen.getByRole('button', { name: /ocultar/i })).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: /ocultar/i }));
    reopened.unmount();

    const closed = render(section('operations:1'));
    expect(screen.getByRole('button', { name: /mostrar/i })).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: /mostrar/i }));
    closed.unmount();

    render(section('operations:2'));
    expect(screen.getByRole('button', { name: /mostrar/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('permite alternar si el almacenamiento está bloqueado', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    try {
      render(<CollapsibleFilterSection storageKey="operations:1">Filtros</CollapsibleFilterSection>);
      await userEvent.click(screen.getByRole('button', { name: /mostrar/i }));
      expect(screen.getByRole('button', { name: /ocultar/i })).toHaveAttribute('aria-expanded', 'true');
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('inicia retraída y permite mostrar y ocultar sus filtros', async () => {
    const user = userEvent.setup();

    render(
      <CollapsibleFilterSection>
        <label htmlFor="search">Buscar</label>
        <input id="search" />
      </CollapsibleFilterSection>,
    );

    const toggle = screen.getByRole('button', { name: /mostrar/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Buscar')).not.toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(screen.queryByLabelText('Buscar')).not.toBeInTheDocument();
  });
});
