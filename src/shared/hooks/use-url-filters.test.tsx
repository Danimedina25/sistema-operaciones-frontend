import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
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
  beforeEach(() => window.sessionStorage.clear());

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

  it('restaura el caché cuando la URL no contiene filtros', () => {
    window.sessionStorage.setItem(
      'table-filters:/operaciones',
      JSON.stringify({ search: 'guardado', status: 'DONE', page: 2 }),
    );

    const { result } = renderHook(() => useUrlFilters(DEFAULTS), { wrapper });

    expect(result.current.filters).toEqual({ search: 'guardado', status: 'DONE', page: 2 });
  });
  it('no guarda defaults automáticamente ni recupera el caché anterior con una clave nueva', () => {
    window.sessionStorage.setItem('table-filters:/operaciones', JSON.stringify({ status: 'DONE' }));
    const { result } = renderHook(() => useUrlFilters(DEFAULTS, 'operations:v2:1'), { wrapper });
    expect(result.current.filters).toEqual(DEFAULTS);
    expect(window.sessionStorage.getItem('operations:v2:1')).toBeNull();
  });

  it('conserva fechas vacías explícitas en la URL al recargar un rango personalizado', () => {
    const defaults = { ...DEFAULTS, dateFilter: 'THIS_MONTH', startDate: '' };
    const selected = { ...defaults, dateFilter: '', startDate: '2026-09-02' };
    const first = renderHook(() => ({
      ...useUrlFilters(defaults, 'operations:v2:1'),
      params: useSearchParams()[0],
    }), { wrapper });
    act(() => first.result.current.setFilters(selected));
    expect(first.result.current.filters).toEqual(selected);
    const url = `/operaciones?${first.result.current.params.toString()}`;
    expect(first.result.current.params.has('dateFilter')).toBe(true);
    first.unmount();
    const reloaded = renderHook(() => useUrlFilters(defaults, 'operations:v2:1'), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>,
    });
    expect(reloaded.result.current.filters).toEqual(selected);
    reloaded.unmount();
    const reopened = renderHook(() => useUrlFilters(defaults, 'operations:v2:1'), { wrapper });
    expect(reopened.result.current.filters).toEqual(selected);
    const otherUser = renderHook(() => useUrlFilters(defaults, 'operations:v2:2'), { wrapper });
    expect(otherUser.result.current.filters).toEqual(defaults);
  });

});
