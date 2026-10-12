import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { MyCommissionsTable } from './MyCommissionsTable';
import type { MyWeeklyCommissionOperationResponse } from '../types/commercial-partner-commissions.types';

const operation: MyWeeklyCommissionOperationResponse = {
  operationId: 40, cliente: 'Cliente de prueba', fechaOperacion: '2026-09-20', montoOperacion: 300000,
  nivelesRedComercial: 3, porcentajeComision: 1, miComision: 3000, myCommissionStatus: 'GENERADA',
  comisionRed: 600, comisionNivel2: 0, comisionNivel3: 600,
  socioNivel2: 'Socio nivel dos', socioNivel3: 'Socia nivel tres', statusNivel2: 'GENERADA', statusNivel3: 'PAGADA',
};

it('limita a siete columnas y revela el desglose de la red bajo la operación', async () => {
  render(<MyCommissionsTable operations={[operation]} />);
  expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  expect(screen.getByRole('table')).toHaveTextContent('$3,000.00');
  expect(screen.getByTestId('data-table-mobile')).toHaveTextContent('1%');
  expect(screen.getByRole('table')).not.toHaveTextContent('Socia nivel tres');
  await userEvent.click(screen.getAllByRole('button', { name: 'Ver desglose de #40' })[0]);
  expect(screen.getByRole('table')).toHaveTextContent('Socia nivel tres');
  expect(screen.getAllByRole('button', { name: 'Ocultar desglose de #40' })[0]).toHaveAttribute('aria-expanded', 'true');
});
