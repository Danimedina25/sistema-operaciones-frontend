import type { ClienteResponse } from '@/modules/clientes/types/clientes.types';

export interface ClientesFilters {
  search: string;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

export function filterClientes(
  clientes: ClienteResponse[],
  filters: ClientesFilters,
): ClienteResponse[] {
  return clientes.filter((cliente) => {
    const search = filters.search.trim().toLowerCase();

    const matchesSearch =
      !search ||
      cliente.nombre.toLowerCase().includes(search);

    const matchesStatus =
      filters.status === 'ALL' ||
      (filters.status === 'ACTIVE' && cliente.activo) ||
      (filters.status === 'INACTIVE' && !cliente.activo);

    return matchesSearch && matchesStatus;
  });
}