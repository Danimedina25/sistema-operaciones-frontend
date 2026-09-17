import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CashLedgerTable } from './CashLedgerTable';
import { emptyCounts } from '../utils/cash-amounts';
import type { CashDay, CashLedger, CashMovement } from '../types/caja-general.types';

const day: CashDay = {
  id: 1, fecha: '2026-09-17', version: 0, saldoInicial: 12418, saldoActual: 5418,
  saldoContado: null, diferencia: null,
  apertura: { ...emptyCounts(), D1000: 12, D200: 2, D10: 1, D5: 1, D2: 1, D1: 1 },
  cierre: {}, denominacionesEsperadas: null,
  createdAt: '2026-09-17T08:12:00', closedAt: null, observacionesCierre: null,
  abiertoPor: 3, abiertoPorNombre: 'Jefa de Cajas', cerradoPor: null,
};

function movement(overrides: Partial<CashMovement>): CashMovement {
  return {
    id: 1, diaId: 1, fecha: '2026-09-17', createdAt: '2026-09-17T09:40:00',
    direccion: 'SALIDA', tipo: 'EFECTIVO', concepto: 'Retorno en efectivo · Operación #38',
    banco: null, monto: 10000, saldoAcumulado: 2418,
    bankAccountId: null, cuentaBanco: null, cuentaTitular: null, cuentaNumero: null, cuentaActiva: null,
    parcialidadId: 7, operacionId: 38, denominaciones: { ...emptyCounts(), D1000: 10 },
    comprobanteUrl: null, creadoPor: 3,
    ...overrides,
  };
}

function mount(ledger: CashLedger) {
  render(<MemoryRouter><CashLedgerTable ledger={ledger} /></MemoryRouter>);
}

const salida = movement({});
const entrada = movement({
  id: 2, createdAt: '2026-09-17T11:05:00', direccion: 'ENTRADA', tipo: 'RETIRO_SIN_TARJETA',
  concepto: 'Retiro sin tarjeta', monto: 10000, saldoAcumulado: 12418,
  parcialidadId: null, operacionId: null, denominaciones: { ...emptyCounts(), D1000: 10 },
});

describe('Libro de movimientos', () => {
  it('resume entradas, salidas y saldo del día', () => {
    mount({ dias: [day], movimientos: [salida, entrada] });

    expect(screen.getByText('Entradas del día').parentElement).toHaveTextContent('$10,000.00');
    expect(screen.getByText('Salidas del día').parentElement).toHaveTextContent('$10,000.00');
    expect(screen.getByText('Saldo acumulado').parentElement).toHaveTextContent('$5,418.00');
  });

  it('muestra la apertura y cada movimiento con su hora, signo y saldo', () => {
    mount({ dias: [day], movimientos: [salida, entrada] });

    expect(screen.getByRole('button', { name: /Inicio en caja/ })).toHaveTextContent('08:12');
    expect(screen.getByRole('button', { name: /Retorno en efectivo/ })).toHaveTextContent('−$10,000.00');
    expect(screen.getByRole('button', { name: /Retiro sin tarjeta/ })).toHaveTextContent('+$10,000.00');
    // El saldo acumulado se conserva aunque ya no exista la columna.
    expect(screen.getByRole('button', { name: /Retorno en efectivo/ })).toHaveTextContent('saldo $2,418.00');
  });

  it('nace colapsado y despliega el detalle al pulsar la fila', () => {
    mount({ dias: [day], movimientos: [salida] });
    const row = screen.getByRole('button', { name: /Retorno en efectivo/ });

    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /Ver operación #38/ })).not.toBeInTheDocument();

    fireEvent.click(row);

    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /Ver operación #38/ })).toBeInTheDocument();

    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'false');
  });

  it('enlaza al detalle de la operación solo cuando el movimiento la tiene', () => {
    mount({ dias: [day], movimientos: [salida, entrada] });

    fireEvent.click(screen.getByRole('button', { name: /Retorno en efectivo/ }));
    expect(screen.getByRole('link', { name: /Ver operación #38/ })).toHaveAttribute('href', '/operaciones/38');

    fireEvent.click(screen.getByRole('button', { name: /Retiro sin tarjeta/ }));
    expect(screen.getAllByRole('link', { name: /Ver operación/ })).toHaveLength(1);

    // La apertura nunca tiene operación vinculada.
    fireEvent.click(screen.getByRole('button', { name: /Inicio en caja/ }));
    expect(screen.getAllByRole('link', { name: /Ver operación/ })).toHaveLength(1);
  });

  it('lista solo las denominaciones presentes, con su subtotal', () => {
    mount({ dias: [day], movimientos: [salida] });
    fireEvent.click(screen.getByRole('button', { name: /Inicio en caja/ }));

    // Acotado al detalle de esa fila: el libro también es una lista.
    const openingRow = screen.getByRole('button', { name: /Inicio en caja/ }).closest('li') as HTMLElement;
    const cards = within(openingRow).getAllByRole('listitem');

    // La apertura tiene 6 denominaciones con cantidad; las otras cinco están en cero.
    expect(cards).toHaveLength(6);

    // 12 billetes de $1,000 = $12,000.
    const mil = cards.find(card => card.textContent?.startsWith('$1,000.00')) as HTMLElement;
    expect(mil).toHaveTextContent('× 12');
    expect(mil).toHaveTextContent('$12,000.00');

    // Ninguna tarjeta corresponde a una denominación en cero.
    expect(cards.every(card => !/×\s*0$/.test(card.textContent ?? ''))).toBe(true);
  });

  it('avisa cuando un movimiento no trae desglose', () => {
    mount({ dias: [day], movimientos: [movement({ denominaciones: emptyCounts() })] });
    fireEvent.click(screen.getByRole('button', { name: /Retorno en efectivo/ }));

    expect(screen.getByText('Sin desglose capturado.')).toBeInTheDocument();
  });

  it('destaca el corte total del día', () => {
    mount({ dias: [day], movimientos: [salida] });

    const footer = screen.getByText('Corte total del día (esperado)').parentElement as HTMLElement;
    expect(within(footer).getByText('$5,418.00')).toBeInTheDocument();
  });

  it('muestra el cierre con su desglose cuando la caja ya cerró', () => {
    const closed: CashDay = {
      ...day, closedAt: '2026-09-17T18:00:00', saldoContado: 5400, diferencia: -18,
      observacionesCierre: 'Faltante por redondeo', cierre: { ...emptyCounts(), D1000: 5, D200: 2 },
    };
    mount({ dias: [closed], movimientos: [salida] });

    expect(screen.getByText('Caja cerrada')).toBeInTheDocument();
    expect(screen.getByText('Desglose del cierre')).toBeInTheDocument();
    expect(screen.getByText('Faltante por redondeo')).toBeInTheDocument();
  });

  it('permite eliminar el corte solo cuando se autoriza', () => {
    const onDelete = vi.fn();
    const { unmount } = render(<MemoryRouter><CashLedgerTable ledger={{ dias: [day], movimientos: [] }} /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Eliminar corte' })).not.toBeInTheDocument();
    unmount();

    render(<MemoryRouter><CashLedgerTable ledger={{ dias: [day], movimientos: [] }} canDelete onDelete={onDelete} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar corte' }));
    expect(onDelete).toHaveBeenCalledWith(day);
  });

  it('informa cuando no hay aperturas en el periodo', () => {
    mount({ dias: [], movimientos: [] });
    expect(screen.getByText('No hay aperturas registradas en este periodo.')).toBeInTheDocument();
  });
});
