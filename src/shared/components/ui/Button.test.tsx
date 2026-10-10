import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it.each([
    ['primary', 'bg-brand'],
    ['neutral', 'bg-surface'],
    ['success', 'bg-success'],
    ['destructive', 'bg-danger'],
  ] as const)('aplica la variante %s', (variant, className) => {
    render(<Button variant={variant}>Acción</Button>);
    expect(screen.getByRole('button', { name: 'Acción' })).toHaveClass(className);
  });

  it('usa primario por defecto y respeta las clases adicionales', () => {
    render(<Button className="w-full">Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveClass('bg-brand', 'w-full');
  });

  it('da prioridad al color de la variante frente a colores antiguos en className', () => {
    render(<Button variant="primary" className="w-full bg-slate-950 hover:bg-slate-800">Entrar</Button>);
    const button = screen.getByRole('button', { name: 'Entrar' });
    expect(button).toHaveClass('w-full', 'bg-brand', 'hover:bg-brand-strong');
    expect(button).not.toHaveClass('bg-slate-950', 'hover:bg-slate-800');
  });

  it('deshabilita mientras procesa', () => {
    render(<Button isLoading>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Procesando...' })).toBeDisabled();
  });
});
