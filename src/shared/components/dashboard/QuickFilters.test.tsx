import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickFilters } from './QuickFilters';

const OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'DONE', label: 'Completadas' },
];

describe('QuickFilters', () => {
  it('marca como activa la opción que coincide con el valor actual', () => {
    render(<QuickFilters options={OPTIONS} value="PENDING" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Pendientes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('no marca ninguna opción activa si el valor no coincide con ninguna', () => {
    render(<QuickFilters options={OPTIONS} value="SOMETHING_ELSE" onChange={vi.fn()} />);

    OPTIONS.forEach((option) => {
      expect(screen.getByRole('button', { name: option.label })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });

  it('invoca onChange con el value de la opción seleccionada', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<QuickFilters options={OPTIONS} value="ALL" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Completadas' }));

    expect(onChange).toHaveBeenCalledWith('DONE');
  });
});
