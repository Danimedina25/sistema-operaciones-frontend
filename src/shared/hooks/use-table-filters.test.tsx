import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTableFilters, useTableUrlFilters } from './use-table-filters';

const auth = vi.hoisted(() => ({ user: { userId: 1 } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => auth }));
const defaults = { search: '', status: 'ACTIVE', dateFilter: 'THIS_MONTH' };

beforeEach(() => {
  window.sessionStorage.clear();
  auth.user = { userId: 1 };
});

describe('filtros por tabla y usuario', () => {
  it('guarda solo selecciones y las restaura al volver sin compartirlas entre usuarios ni tablas', () => {
    const first = renderHook(({ table }) => useTableFilters(table, defaults), { initialProps: { table: 'clients' } });
    expect(first.result.current.filters).toEqual(defaults);
    expect(window.sessionStorage.length).toBe(0);
    act(() => first.result.current.setFilters({ ...defaults, search: 'Ana' }));
    first.rerender({ table: 'banks' });
    expect(first.result.current.filters).toEqual(defaults);
    first.rerender({ table: 'clients' });
    expect(first.result.current.filters.search).toBe('Ana');
    auth.user = { userId: 2 };
    first.rerender({ table: 'clients' });
    expect(first.result.current.filters).toEqual(defaults);
    first.unmount();
    auth.user = { userId: 1 };
    const reloaded = renderHook(() => useTableFilters('clients', defaults));
    expect(reloaded.result.current.filters.search).toBe('Ana');
  });

  it('restaura filtros URL al regresar y mantiene independientes las rutas', () => {
    const wrapper = (route: string) => ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    );
    const first = renderHook(() => useTableUrlFilters(defaults), { wrapper: wrapper('/returns') });
    act(() => first.result.current.setFilters({ ...defaults, dateFilter: '', search: '25' }));
    first.unmount();
    const reloaded = renderHook(() => useTableUrlFilters(defaults), { wrapper: wrapper('/returns') });
    expect(reloaded.result.current.filters).toEqual({ ...defaults, dateFilter: '', search: '25' });
    const other = renderHook(() => useTableUrlFilters(defaults), { wrapper: wrapper('/deliveries') });
    expect(other.result.current.filters).toEqual(defaults);
  });
});
