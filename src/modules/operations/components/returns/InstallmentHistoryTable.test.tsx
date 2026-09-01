import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InstallmentHistoryTable } from './InstallmentHistoryTable';
import type { ReturnInstallment } from '../../types/operations.types.ts';

const base: ReturnInstallment = {
  id: 1,
  returnRequestId: 3,
  operationId: 55,
  monto: 10000,
  tipoPago: 'EFECTIVO',
  estatus: 'COMPLETADA',
  entregadoPorNombre: 'Jefa de Cajas',
};

describe('InstallmentHistoryTable — persona que recibió', () => {
  it('muestra por separado quién registró la entrega y quién recibió físicamente', () => {
    render(
      <InstallmentHistoryTable
        installments={[{ ...base, personaQueRecibioEfectivo: 'María Gómez Díaz' }]}
      />,
    );

    expect(screen.getByText('María Gómez Díaz')).toBeInTheDocument();
    expect(screen.getByText('Jefa de Cajas')).toBeInTheDocument();
  });

  it('muestra "No registrado (entrega histórica)" cuando la parcialidad completada no tiene el dato', () => {
    render(
      <InstallmentHistoryTable
        installments={[{ ...base, personaQueRecibioEfectivo: null }]}
      />,
    );

    expect(screen.getByText('No registrado (entrega histórica)')).toBeInTheDocument();
  });

  it('no muestra receptor para métodos que no son efectivo/RST', () => {
    render(
      <InstallmentHistoryTable
        installments={[
          { ...base, tipoPago: 'TRANSFERENCIA', personaQueRecibioEfectivo: null },
        ]}
      />,
    );

    expect(screen.queryByText('No registrado (entrega histórica)')).not.toBeInTheDocument();
  });
});

describe('InstallmentHistoryTable — solo consulta', () => {
  it('sin handlers no renderiza columna ni botones de acción', () => {
    render(
      <InstallmentHistoryTable
        installments={[{ ...base, estatus: 'PROGRAMADA' }]}
      />,
    );

    expect(screen.queryByRole('columnheader', { name: 'Acciones' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /marcar entregada/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it('con handlers y permiso sí renderiza la acción correspondiente', () => {
    render(
      <InstallmentHistoryTable
        installments={[{ ...base, estatus: 'PROGRAMADA' }]}
        canConfirm={() => true}
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar recepción/i })).toBeInTheDocument();
  });

  it('usa el mensaje vacío personalizado', () => {
    render(
      <InstallmentHistoryTable installments={[]} emptyMessage="Sin recolecciones todavía." />,
    );
    expect(screen.getByText('Sin recolecciones todavía.')).toBeInTheDocument();
  });
});
