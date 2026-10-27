import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';
import type { ClienteResponse } from '@/modules/clientes/types/clientes.types';
import { ClienteStatusBadge } from './ClienteStatusBadge';

interface Props {
  clientes: ClienteResponse[];
  processingClienteId: number | null;
  canEdit: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
  onEdit: (cliente: ClienteResponse) => void;
  onActivate: (clienteId: number) => void;
  onDeactivate: (clienteId: number) => void;
  onDelete: (cliente: ClienteResponse) => void;
}

export function ClientesTable({ clientes, processingClienteId, canEdit, canChangeStatus, canDelete, onEdit, onActivate, onDeactivate, onDelete }: Props) {
  const initials = (value: string) => value.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toLocaleUpperCase('es-MX');
  const name = (cliente: ClienteResponse) => <div className="flex min-w-0 items-center gap-3">
    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{initials(cliente.nombre)}</span>
    <span className="min-w-0 truncate font-semibold text-slate-900" title={cliente.nombre}>{cliente.nombre}</span>
    {!cliente.activo && <ClienteStatusBadge active={false} />}
  </div>;
  const actions = (cliente: ClienteResponse) => !(canEdit || canChangeStatus || canDelete) ? null : <RowActionsMenu triggerLabel="" ariaLabel={`Opciones de ${cliente.nombre}`} triggerClassName="min-w-10 justify-center px-2" triggerDisabled={processingClienteId === cliente.id}>
    {canEdit && <button type="button" onClick={() => onEdit(cliente)} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Editar</button>}
    {canChangeStatus && (cliente.activo
      ? <button type="button" onClick={() => onDeactivate(cliente.id)} className="block w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50">Desactivar</button>
      : <button type="button" onClick={() => onActivate(cliente.id)} className="block w-full px-4 py-2.5 text-left text-sm text-emerald-700 hover:bg-emerald-50">Activar</button>)}
    {canDelete && <button type="button" onClick={() => onDelete(cliente)} className="block w-full border-t border-red-100 px-4 py-2.5 text-left text-sm text-red-900 hover:bg-red-50">Eliminar definitivamente</button>}
  </RowActionsMenu>;
  const columns: DataTableColumn<ClienteResponse>[] = [
    { key: 'name', header: 'Nombre', cell: name },
    ...(canEdit || canChangeStatus || canDelete ? [{ key: 'actions', header: 'Opciones', cell: actions, kind: 'actions' as const, align: 'right' as const, width: '90px' }] : []),
  ];
  return <DataTable columns={columns} rows={clientes} dense getRowKey={(cliente) => cliente.id}
    emptyTitle="No se encontraron clientes" emptyDescription="Prueba otra búsqueda o cambia el filtro de estado."
    mobile={{ title: name, fields: [], actions: canEdit || canChangeStatus || canDelete ? actions : undefined }} />;
}
