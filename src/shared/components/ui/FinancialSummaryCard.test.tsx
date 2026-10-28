import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FinancialSummaryCard } from './FinancialSummaryCard';

describe('FinancialSummaryCard', () => {
  it('muestra el contexto y las cifras dentro de una tarjeta fija', () => {
    render(<FinancialSummaryCard label="Resumen del cheque" context="Operación #48"
      metrics={[{ label: 'Monto del cheque', value: '$1,500.00', tone: 'blue' }, { label: 'Total contado', value: '$1,000.00' }]} />);
    const card = screen.getByRole('region', { name: 'Resumen del cheque' });
    expect(card).toHaveClass('sticky', 'top-0', 'border-slate-200');
    expect(within(card).getByText('Operación #48')).toBeInTheDocument();
    expect(within(card).getByText('Monto del cheque')).toBeInTheDocument();
    expect(within(card).getByText('$1,500.00')).toBeInTheDocument();
    expect(within(card).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra solo el primer error aunque haya varios y marca la tarjeta en rojo', () => {
    render(<FinancialSummaryCard label="Resumen" errors={['', null, 'Caja cerrada', 'Falta el comprobante']} />);
    const card = screen.getByRole('region', { name: 'Resumen' });
    expect(card).toHaveClass('border-red-300');
    expect(within(card).getAllByRole('alert').map(alert => alert.textContent)).toEqual(['Caja cerrada']);
  });

  it.each([[true, 'text-emerald-700'], [false, 'text-amber-800']])('pinta el estado según si cuadra (%s)', (ok, color) => {
    render(<FinancialSummaryCard label="Resumen" status={{ text: 'Total contado $10.00', ok }} />);
    expect(screen.getByText('Total contado $10.00')).toHaveClass(color);
  });

  it('muestra avisos que no son errores sin marcar la tarjeta', () => {
    render(<FinancialSummaryCard label="Resumen" warnings={['La caja cambió durante el conteo']} />);
    expect(screen.getByRole('status')).toHaveTextContent('La caja cambió durante el conteo');
    expect(screen.getByRole('region', { name: 'Resumen' })).toHaveClass('border-slate-200');
  });
});
