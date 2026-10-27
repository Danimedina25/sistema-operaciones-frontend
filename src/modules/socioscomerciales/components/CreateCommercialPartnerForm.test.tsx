import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { CreateCommercialPartnerForm } from './CreateCommercialPartnerForm';

it('el Socio registra un socio secundario sin fijar nivel ni comisión', () => {
  render(<CreateCommercialPartnerForm isSubmitting={false} onSubmit={vi.fn()} />);
  expect(screen.queryByText('Porcentaje de comisión sugerido')).not.toBeInTheDocument();
  expect(screen.getByText(/Gerencia configurará la comisión/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Nivel en tu red')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Pertenece a socio de nivel 2')).not.toBeInTheDocument();
});
