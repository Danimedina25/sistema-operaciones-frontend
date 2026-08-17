import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { useUrlFilters } from './use-url-filters';

const DEFAULTS = {
  search: '',
  status: 'ALL',
  page: 0,
};

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/operaciones']}>{children}</MemoryRouter>;
}

describe('useUrlFilters', () => {
  it('devuelve los valores por defecto cuando la URL no tiene query params', () => {
    const { result } = renderHook(() => useUrlFilters(DEFAULTS), { wrapper });

    expect(result.current.filters).toEqual(DEFAULTS);
  });

  it('escribe en la URL solo los valores distintos al default', () => {
    function Harness() {
      const { filters, setFilters } = useUrlFilters(DEFAULTS);
      const [searchParams] = useSearchParams();

      return (
        <div>
          <span data-testid="search-param">{searchParams.get('search') ?? ''}</span>
          <span data-testid="status-param">{searchParams.toString()}</span>
          <button
            type="button"
            onClick={() => setFilters({ ...filters, search: 'folio-123', status: 'ALL' })}
          >
            Filtrar
          </button>
        </div>
      );
    }

    render(<Harness />, { wrapper });

    act(() => {
      screen.getByRole('button', { name: 'Filtrar' }).click();
    });

    expect(screen.getByTestId('search-param').textContent).toBe('folio-123');
    expect(screen.getByTestId('status-param').textContent).not.toContain('status=');
  });

  it('limpia todos los query params con resetFilters', () => {
    function Harness() {
      const { setFilters, resetFilters } = useUrlFilters(DEFAULTS);
      const [searchParams] = useSearchParams();

      return (
        <div>
          <span data-testid="params">{searchParams.toString()}</span>
          <button type="button" onClick={() => setFilters({ search: 'x', status: 'DONE', page: 2 })}>
            Set
          </button>
          <button type="button" onClick={resetFilters}>
            Reset
          </button>
        </div>
      );
    }

    render(<Harness />, { wrapper });

    act(() => {
      screen.getByRole('button', { name: 'Set' }).click();
    });
    expect(screen.getByTestId('params').textContent).not.toBe('');

    act(() => {
      screen.getByRole('button', { name: 'Reset' }).click();
    });
    expect(screen.getByTestId('params').textContent).toBe('');
  });
});
