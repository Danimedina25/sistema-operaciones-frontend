import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { OperationStatusBadge } from './OperationStatusBadge';

it('usa la píldora semántica y conserva el texto de retorno por solicitar', () => {
  const { rerender } = render(<OperationStatusBadge status="VALIDADA" isReturn />);
  expect(screen.getByText('Retorno por solicitar')).toHaveClass('bg-violet-100');
  rerender(<OperationStatusBadge status="RECHAZADA" />);
  expect(screen.getByText('Rechazada')).toHaveClass('bg-red-100');
});
