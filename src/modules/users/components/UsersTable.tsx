import type { ReactNode } from 'react';
import { formatRole } from '@/shared/utils/role-labels';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { CanAccess } from '@/shared/components/CanAccess';
import { UserVerificationBadge } from '@/modules/users/components/UserVerificationBadge';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';
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

export function UsersTable({
  users,
  processingUserId,
  onEdit,
  onUpdateEmail,
  onActivate,
  onDeactivate,
  onResendActivation,
  onDelete,
}: UsersTableProps) {
  function renderActions(user: UserResponse): ReactNode {
    return (
      <>
        <button
          type="button"
          onClick={() => onEdit(user)}
          className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => onUpdateEmail(user)}
          className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Actualizar correo
        </button>

        {user.correoVerificado && user.activo && (
          <button
            type="button"
            onClick={() => onDeactivate(user.id)}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Desactivar
          </button>
        )}

        {user.correoVerificado && !user.activo && (
          <button
            type="button"
            onClick={() => onActivate(user.id)}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Activar
          </button>
        )}

        {!user.correoVerificado && (
          <button
            type="button"
            onClick={() => onResendActivation(user.id)}
            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Reenviar activación
          </button>
        )}

        <CanAccess roles={['ADMIN', 'DIRECCION']}>
          <button
            type="button"
            onClick={() => onDelete(user)}
            className="block w-full border-t border-red-100 bg-red-50/50 px-4 py-2.5 text-left text-sm font-bold text-red-900 transition hover:bg-red-100"
          >
            Eliminar definitivamente
          </button>
        </CanAccess>
      </>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No se encontraron usuarios con los filtros seleccionados.
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet ancho: tabla completa */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Verificación</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const isProcessing = processingUserId === user.id;

                return (
                  <tr key={user.id} className="border-t border-slate-200 text-sm transition-colors hover:bg-blue-50/40">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {user.nombre}
                    </td>

                    <td className="px-4 py-4 text-slate-600">{user.correo}</td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatRole(user.roleName)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge active={user.activo} />
                    </td>

                    <td className="px-4 py-4">
                      <UserVerificationBadge verified={user.correoVerificado} />
                    </td>

                    <td className="px-4 py-4 text-right">
                      <RowActionsMenu
                        triggerLabel={isProcessing ? 'Procesando...' : 'Opciones'}
                        triggerDisabled={isProcessing}
                      >
                        {renderActions(user)}
                      </RowActionsMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Móvil: tarjetas apiladas */}
      <div className="space-y-3 md:hidden">
        {users.map((user) => {
          const isProcessing = processingUserId === user.id;

          return (
            <div
              key={user.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.nombre}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user.correo}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge active={user.activo} />
                  <UserVerificationBadge verified={user.correoVerificado} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Rol</p>
                  <p className="font-medium text-slate-900">{formatRole(user.roleName)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onEdit(user)}
                  className="min-h-[44px] flex-1 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Editar
                </button>
                <RowActionsMenu
                  triggerLabel={isProcessing ? 'Procesando...' : 'Más'}
                  triggerDisabled={isProcessing}
                >
                  {renderActions(user)}
                </RowActionsMenu>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
