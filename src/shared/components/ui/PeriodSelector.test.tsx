import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeriodSelector } from './PeriodSelector';
import type { PeriodSelection } from '@/shared/utils/period';

const now = new Date('2026-10-12T04:30:00Z'); // 11 oct, 22:30 en Ciudad de México.
const all: PeriodSelection = { mode: 'all', startDate: '', endDate: '' };

function mount(value: PeriodSelection = all) {
  const onApply = vi.fn();
  const view = render(<PeriodSelector value={value} onApply={onApply} now={now} />);
  fireEvent.click(screen.getByRole('button', { name: /^Periodo:/ }));
  const dialog = screen.getByRole('dialog', { name: 'Seleccionar periodo' });
  return { onApply, dialog, ...view };
}

function day(dialog: HTMLElement, iso: string) {
  const button = dialog.querySelector<HTMLButtonElement>(`[data-day="${iso}"] button`);
  if (!button) throw new Error(`Falta día ${iso}`);
  return button;
}

describe('PeriodSelector', () => {
  it('elige un día y no aplica hasta pulsar Aplicar', () => {
    const { onApply, dialog } = mount();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Un día' }));
    fireEvent.click(day(dialog, '2026-10-02'));
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar' }));
    expect(onApply).toHaveBeenCalledExactlyOnceWith({ mode: 'day', startDate: '2026-10-02', endDate: '2026-10-02' });
  });

  it('elige y aplica un rango en el mismo calendario', () => {
    const { onApply, dialog } = mount();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rango de fechas' }));
    fireEvent.click(day(dialog, '2026-10-02'));
    fireEvent.click(day(dialog, '2026-10-08'));
    expect(within(dialog).getByText('2 – 8 oct 2026 · 7 días')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar' }));
    expect(onApply).toHaveBeenCalledExactlyOnceWith({ mode: 'range', startDate: '2026-10-02', endDate: '2026-10-08' });
  });

  it('cancela cambios y conserva el periodo aplicado', () => {
    const { onApply, dialog } = mount();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ayer' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Periodo: Todas las fechas' })).toBeInTheDocument();
  });

  it.each([
    ['Hoy', '2026-10-11', '2026-10-11'],
    ['Ayer', '2026-10-10', '2026-10-10'],
    ['Esta semana', '2026-10-11', '2026-10-11'],
    ['Semana pasada', '2026-10-04', '2026-10-10'],
    ['Este mes', '2026-10-01', '2026-10-11'],
    ['Mes pasado', '2026-09-01', '2026-09-30'],
  ])('aplica el atajo %s solo al confirmar', (shortcut, startDate, endDate) => {
    const { onApply, dialog } = mount();
    fireEvent.click(within(dialog).getByRole('button', { name: shortcut }));
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar' }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ startDate, endDate }));
  });

  it('deshabilita días futuros según la oficina y permite cambiar de mes', () => {
    const { dialog } = mount({ mode: 'day', startDate: '2026-09-15', endDate: '2026-09-15' });
    expect(within(dialog).getByRole('grid', { name: /septiembre/i })).toBeInTheDocument();
    const next = dialog.querySelector<HTMLButtonElement>('.rdp-button_next');
    expect(next).toBeTruthy();
    fireEvent.click(next!);
    expect(within(dialog).getByRole('grid', { name: /octubre/i })).toBeInTheDocument();
    expect(day(dialog, '2026-10-12')).toBeDisabled();
  });

  it('permite volver a Todas las fechas mediante Aplicar', () => {
    const { onApply, dialog } = mount({ mode: 'day', startDate: '2026-10-02', endDate: '2026-10-02' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Todas las fechas' }));
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar' }));
    expect(onApply).toHaveBeenCalledWith(all);
  });

  it('mantiene el calendario dentro de la ventana cuando el filtro está cerca del borde izquierdo', () => {
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 220, right: 480, top: 250, bottom: 303, width: 260, height: 53,
      x: 220, y: 250, toJSON: () => ({}),
    });
    try {
      const { dialog } = mount();
      expect(dialog).toHaveStyle({ left: '220px' });
      expect(dialog).not.toHaveStyle({ right: '0px' });
    } finally { rect.mockRestore(); }
  });
});
