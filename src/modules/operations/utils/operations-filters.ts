import { OperationStatus, PaymentOperationResponse } from "../types/operations.types.ts";


export interface OperationsFilters {
  search: string;
  status: OperationStatus | 'ALL';
}

export function filterOperations(
  operations: PaymentOperationResponse[],
  filters: OperationsFilters,
): PaymentOperationResponse[] {
  return operations.filter((operation) => {
    const search = filters.search.trim().toLowerCase();

    const matchesSearch =
      !search ||
      operation.clienteNombre.toLowerCase().includes(search) ||
      (operation.clienteTelefono ?? '').toLowerCase().includes(search) ||
      operation.cuentaDestinoBanco.toLowerCase().includes(search) ||
      operation.socioComercialNombre.toLowerCase().includes(search);

    const matchesStatus =
      filters.status === 'ALL' || operation.estatus === filters.status;

    return matchesSearch && matchesStatus;
  });
}