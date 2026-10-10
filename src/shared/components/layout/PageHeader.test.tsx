import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('muestra título y acciones sin tarjeta ni descripción', () => {
    render(<PageHeader title="Corte de caja" description="Texto anterior" actions={<button>Periodo</button>} />);

    const title = screen.getByRole('heading', { level: 1, name: 'Corte de caja' });
    expect(title).toHaveClass('text-page-title');
    expect(screen.getByRole('button', { name: 'Periodo' })).toBeInTheDocument();
    expect(screen.queryByText('Texto anterior')).not.toBeInTheDocument();
    expect(title.closest('header')).not.toHaveClass('bg-white', 'shadow-sm');
  });
});
