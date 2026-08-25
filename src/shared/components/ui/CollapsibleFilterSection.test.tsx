import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CollapsibleFilterSection } from './CollapsibleFilterSection';

describe('CollapsibleFilterSection', () => {
  it('inicia retraída y permite mostrar y ocultar sus filtros', async () => {
    const user = userEvent.setup();

    render(
      <CollapsibleFilterSection>
        <label htmlFor="search">Buscar</label>
        <input id="search" />
      </CollapsibleFilterSection>,
    );

    const toggle = screen.getByRole('button', { name: /mostrar/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Buscar')).not.toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(screen.queryByLabelText('Buscar')).not.toBeInTheDocument();
  });
});
