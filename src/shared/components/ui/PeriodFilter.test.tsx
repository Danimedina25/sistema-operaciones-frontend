import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeriodDateField, PeriodModeToggle, type PeriodMode } from './PeriodFilter';

function renderField(mode: PeriodMode, overrides: Partial<Parameters<typeof PeriodDateField>[0]> = {}) {
  const onFechaChange = vi.fn();
  const onRangeChange = vi.fn();

  render(
    <PeriodDateField
      id="periodo-fecha"
      mode={mode}
      dailyLabel="Fecha del corte"
      fecha="2026-09-21"
      startDate="2026-09-01"
      endDate="2026-09-21"
      onFechaChange={onFechaChange}
      onRangeChange={onRangeChange}
      {...overrides}
    />,
  );

  return { onFechaChange, onRangeChange };
}

describe('PeriodModeToggle', () => {
  it('marca la opción vigente y avisa del cambio', () => {
    const onChange = vi.fn();
    render(<PeriodModeToggle mode="daily" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Día' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Rango de fechas' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Rango de fechas' }));
    expect(onChange).toHaveBeenCalledWith('range');
  });
});

describe('PeriodDateField', () => {
  it('en modo Día captura una sola fecha', () => {
    const { onFechaChange } = renderField('daily');

    const input = screen.getByLabelText('Fecha del corte');
    expect(input).toHaveValue('2026-09-21');

    fireEvent.change(input, { target: { value: '2026-09-15' } });
    expect(onFechaChange).toHaveBeenCalledWith('2026-09-15');
  });

  it('en modo Rango cambia al calendario y deja de pedir una fecha suelta', () => {
    renderField('range');

    expect(screen.queryByLabelText('Fecha del corte')).toBeNull();
    expect(screen.getByText('Rango de fechas')).toBeInTheDocument();
  });

  it('traslada el tope de fecha al campo', () => {
    renderField('daily', { maxDate: '2026-09-21' });

    expect(screen.getByLabelText('Fecha del corte')).toHaveAttribute('max', '2026-09-21');
  });

  it('sin tope admite cualquier fecha, como el corte', () => {
    renderField('daily');

    expect(screen.getByLabelText('Fecha del corte')).not.toHaveAttribute('max');
  });
});
