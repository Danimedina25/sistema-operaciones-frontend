import type { ReactNode } from 'react';
import { CanAccess } from '@/shared/components/CanAccess';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { formatRole } from '@/shared/utils/role-labels';
import type { UserResponse } from '@/modules/users/types/users.types';

interface UsersTableProps {
  users: UserResponse[];
  processingUserId: number | null;
  onEdit: (user: UserResponse) => void;
  onUpdateEmail: (user: UserResponse) => void;
  onActivate: (userId: number) => void;
  onDeactivate: (userId: number) => void;
  onResendActivation: (userId: number) => void;
  onDelete: (user: UserResponse) => void;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
}

function roleTone(role: UserResponse['roleName']) {
  if (role === 'JEFA_CAJAS') return 'success';
  if (role === 'SOCIO_COMERCIAL') return 'request';
  if (role === 'GERENTE' || role === 'JEFA_CUENTAS' || role === 'AUXILIAR_CUENTAS') return 'active';
  return 'neutral';
}

export function UsersTable({
  users, processingUserId, onEdit, onUpdateEmail, onActivate, onDeactivate, onResendActivation, onDelete,
}: UsersTableProps) {
  function renderActions(user: UserResponse): ReactNode {
    return <>
      <button type="button" onClick={() => onEdit(user)} className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">Editar</button>
      <button type="button" onClick={() => onUpdateEmail(user)} className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">Actualizar correo</button>
      {user.correoVerificado && user.activo && <button type="button" onClick={() => onDeactivate(user.id)} className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50">Desactivar</button>}
      {user.correoVerificado && !user.activo && <button type="button" onClick={() => onActivate(user.id)} className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Activar</button>}
      {!user.correoVerificado && <button type="button" onClick={() => onResendActivation(user.id)} className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">Reenviar activación</button>}
      <CanAccess roles={['ADMIN', 'DIRECCION']}><button type="button" onClick={() => onDelete(user)}
        className="block w-full border-t border-red-100 bg-red-50/50 px-4 py-2.5 text-left text-sm font-bold text-red-900 hover:bg-red-100">Eliminar definitivamente</button></CanAccess>
    </>;
  }

  const actions = (user: UserResponse) => <RowActionsMenu
    triggerLabel={processingUserId === user.id ? 'Procesando...' : ''}
    ariaLabel={user.nombre + ': Más opciones'} triggerDisabled={processingUserId === user.id}
    triggerClassName="h-8 min-w-9 justify-center px-2">
    {renderActions(user)}
  </RowActionsMenu>;
  const columns: DataTableColumn<UserResponse>[] = [
    { key: 'user', header: 'Usuario', width: '46%', cell: user => <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">{initials(user.nombre)}</span>
      <span className="min-w-0"><strong className="block truncate text-slate-900" title={user.nombre}>{user.nombre}</strong><small className="block truncate text-slate-500" title={user.correo}>{user.correo}</small></span>
    </div> },
    { key: 'role', header: 'Rol', width: '25%', cell: user => <StatusBadge tone={roleTone(user.roleName)}>{user.roleName === 'SOCIO_COMERCIAL' ? 'Socio comercial · nivel 1' : formatRole(user.roleName)}</StatusBadge> },
    { key: 'status', header: 'Estado', kind: 'status', width: '20%', cell: user => <StatusBadge tone={user.activo && user.correoVerificado ? 'success' : user.activo ? 'pending' : 'neutral'} className={user.activo ? 'bg-transparent px-0' : undefined}>{user.activo ? user.correoVerificado ? '✓ Activo · verificado' : 'Activo · pendiente' : 'Inactivo'}</StatusBadge> },
    { key: 'actions', header: 'Acciones', kind: 'actions', width: '9%', align: 'right', cell: actions },
  ];
  return <DataTable columns={columns} rows={users} getRowKey={user => user.id} dense
    mobile={{ title: user => user.nombre, subtitle: user => user.correo, status: user => <StatusBadge active={user.activo} />,
      fields: [{ key: 'role', label: 'Rol', value: user => formatRole(user.roleName) },
        { key: 'verified', label: 'Verificación', value: user => <StatusBadge tone={user.correoVerificado ? 'success' : 'pending'}>{user.correoVerificado ? 'Verificado' : 'Pendiente'}</StatusBadge> }],
      actions: user => <><button type="button" disabled={processingUserId === user.id} onClick={() => onEdit(user)}
        className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 disabled:opacity-50">Editar</button>{actions(user)}</> }}
    emptyTitle="Sin usuarios" emptyDescription="Prueba con otros filtros para encontrar usuarios." />;
}
