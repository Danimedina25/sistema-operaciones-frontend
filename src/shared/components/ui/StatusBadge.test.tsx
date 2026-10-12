import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

it('aplica los colores semánticos y conserva la API de Activo/Inactivo', () => {
  const { rerender } = render(<StatusBadge tone="pending">En tránsito</StatusBadge>);
  expect(screen.getByText('En tránsito')).toHaveClass('bg-amber-100');
  rerender(<StatusBadge tone="request">Por solicitar</StatusBadge>);
  expect(screen.getByText('Por solicitar')).toHaveClass('bg-violet-100');
  rerender(<StatusBadge active />);
  expect(screen.getByText('Activo')).toHaveClass('bg-blue-100');
});
