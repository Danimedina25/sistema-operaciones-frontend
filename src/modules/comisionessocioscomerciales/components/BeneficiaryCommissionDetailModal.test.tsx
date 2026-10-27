import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { BeneficiaryCommissionDetailModal } from './BeneficiaryCommissionDetailModal';

it('consulta el desglose del periodo sin acciones de pago y permite cerrar', async () => {
  const onClose = vi.fn();
  render(<BeneficiaryCommissionDetailModal open onClose={onClose} isLoading={false}
    startDate="2026-10-01" endDate="2026-10-14" detail={{
      beneficiaryId: 2, beneficiaryName: 'Socio de prueba', beneficiaryType: 'COMMERCIAL_PARTNER',
      totalOperations: 1, totalCommission: 12.5,
      operations: [{ commissionId: 7, operationId: 47, clienteNombre: 'Cliente', operationDate: '2026-10-02',
        nivel: 1, operationAmount: 1000, commissionPercentage: 1.25, commissionAmount: 12.5, commissionStatus: 'GENERADA' }],
    }} />);
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Detalle de comisiones');
  expect(screen.getByRole('region', { name: 'Resumen de comisiones' })).toHaveTextContent('$12.50');
  expect(screen.getAllByText('1.25%').length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: /pagar|registrar pago/i })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
