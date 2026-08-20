import { CanAccess } from '@/shared/components/CanAccess';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';
import type { ClienteResponse } from '@/modules/clientes/types/clientes.types';
import { ClienteStatusBadge } from './ClienteStatusBadge';

interface ClientesTableProps {
  clientes: ClienteResponse[];
  processingClienteId: number | null;
  onEdit: (cliente: ClienteResponse) => void;
  onActivate: (clienteId: number) => void;
  onDeactivate: (clienteId: number) => void;
  onDelete: (cliente: ClienteResponse) => void;
}

export function ClientesTable({
  clientes,
  processingClienteId,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: ClientesTableProps) {
  if (clientes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No se encontraron clientes con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              <th className="min-w-[180px] px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {clientes.map((cliente) => {
              const isProcessing = processingClienteId === cliente.id;

              return (
                <tr
                  key={cliente.id}
                  className="border-t border-slate-200 text-sm transition-colors hover:bg-blue-50/40"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {cliente.nombre}
                  </td>

                  <td className="px-4 py-4">
                    <ClienteStatusBadge active={cliente.activo} />
                  </td>

                  <td className="px-4 py-4 text-right">
                    <RowActionsMenu
                      triggerLabel={isProcessing ? 'Procesando...' : 'Opciones'}
                      triggerDisabled={isProcessing}
                    >
                      <button
                        type="button"
                        onClick={() => onEdit(cliente)}
                        className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </button>

                      {cliente.activo ? (
                        <button
                          type="button"
                          onClick={() => onDeactivate(cliente.id)}
                          className="block w-full px-4 py-2.5 text-left text-sm font-semibold  text-red-700 transition hover:bg-red-50"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onActivate(cliente.id)}
                          className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Activar
                        </button>
                      )}

                      <CanAccess roles={['ADMIN', 'DIRECCION']}>
                        <button
                          type="button"
                          onClick={() => onDelete(cliente)}
                          className="block w-full border-t border-red-100 bg-red-50/50 px-4 py-2.5 text-left text-sm font-bold text-red-900 transition hover:bg-red-100"
                        >
                          Eliminar definitivamente
                        </button>
                      </CanAccess>
                    </RowActionsMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}