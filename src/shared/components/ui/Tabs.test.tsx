import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('oculta las pestañas de método cuando solo hay un método', () => {
    render(<Tabs variant="method" label="Métodos" options={[{ value: 'cash', label: 'Efectivo' }]} value="cash" onChange={vi.fn()} />);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('muestra dos métodos y permite cambiar la selección', async () => {
    const onChange = vi.fn();
    render(<Tabs variant="method" label="Métodos" options={[{ value: 'cash', label: 'Efectivo' }, { value: 'bank', label: 'Banco' }]} value="cash" onChange={onChange} />);
    expect(screen.getByRole('tab', { name: 'Efectivo' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Banco' }));
    expect(onChange).toHaveBeenCalledWith('bank');
  });
});
