import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePersistedFilters } from './use-persisted-filters';

const DEFAULTS = { search: '', status: 'ALL' };
const KEY = 'table-filters:test';

describe('usePersistedFilters', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('restaura los filtros almacenados', () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ search: 'OP-25', status: 'ACTIVE' }));

    const { result } = renderHook(() => usePersistedFilters(KEY, DEFAULTS));

    expect(result.current.filters).toEqual({ search: 'OP-25', status: 'ACTIVE' });
  });

  it('guarda los cambios y permite restablecerlos', () => {
    const { result } = renderHook(() => usePersistedFilters(KEY, DEFAULTS));

    act(() => result.current.setFilters({ search: 'cliente', status: 'ALL' }));
    expect(JSON.parse(window.sessionStorage.getItem(KEY) ?? '{}')).toEqual({
      search: 'cliente',
      status: 'ALL',
    });

    act(() => result.current.resetFilters());
    expect(result.current.filters).toEqual(DEFAULTS);
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('ignora un caché inválido', () => {
    window.sessionStorage.setItem(KEY, '{invalid');

    const { result } = renderHook(() => usePersistedFilters(KEY, DEFAULTS));

    expect(result.current.filters).toEqual(DEFAULTS);
  });
});
