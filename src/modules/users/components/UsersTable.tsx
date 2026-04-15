import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatRole } from '@/shared/utils/role-labels';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { UserVerificationBadge } from '@/modules/users/components/UserVerificationBadge';
import type { UserResponse } from '@/modules/users/types/users.types';

interface UsersTableProps {
  users: UserResponse[];
  processingUserId: number | null;
  onEdit: (user: UserResponse) => void;
  onUpdateEmail: (user: UserResponse) => void;
  onActivate: (userId: number) => void;
  onDeactivate: (userId: number) => void;
  onResendActivation: (userId: number) => void;
}

export function UsersTable({
  users,
  processingUserId,
  onEdit,
  onUpdateEmail,
  onActivate,
  onDeactivate,
  onResendActivation,
}: UsersTableProps) {
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuUserId(null);
        setMenuPosition(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleCloseMenu() {
      setOpenMenuUserId(null);
      setMenuPosition(null);
    }

    window.addEventListener('scroll', handleCloseMenu, true);
    window.addEventListener('resize', handleCloseMenu);

    return () => {
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('resize', handleCloseMenu);
    };
  }, []);

  function handleToggleMenu(
    userId: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    if (openMenuUserId === userId) {
      setOpenMenuUserId(null);
      setMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 208;
    const estimatedMenuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedMenuHeight;

    setMenuPosition({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left: Math.max(8, rect.right - menuWidth),
      openUp,
    });

    setOpenMenuUserId(userId);
  }

  function closeMenu() {
    setOpenMenuUserId(null);
    setMenuPosition(null);
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No se encontraron usuarios con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-600">
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
              const isMenuOpen = openMenuUserId === user.id;

              return (
                <tr key={user.id} className="border-t border-slate-200 text-sm">
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
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={(event) => handleToggleMenu(user.id, event)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {isProcessing ? 'Procesando...' : 'Opciones'}
                    </button>

                    {isMenuOpen &&
                      menuPosition &&
                      createPortal(
                        <div
                          ref={menuRef}
                          className="fixed z-[9999] w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                          style={{
                            top: menuPosition.top,
                            left: menuPosition.left,
                            transform: menuPosition.openUp
                              ? 'translateY(-100%)'
                              : 'none',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onEdit(user);
                              closeMenu();
                            }}
                            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onUpdateEmail(user);
                              closeMenu();
                            }}
                            className="block w-full px-4 py-2.5 text-left text-sm text-violet-700 transition hover:bg-violet-50"
                          >
                            Actualizar correo
                          </button>

                          {user.correoVerificado && user.activo && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeactivate(user.id);
                                closeMenu();
                              }}
                              className="block w-full px-4 py-2.5 text-left text-sm text-red-700 transition hover:bg-red-50"
                            >
                              Desactivar
                            </button>
                          )}

                          {user.correoVerificado && !user.activo && (
                            <button
                              type="button"
                              onClick={() => {
                                onActivate(user.id);
                                closeMenu();
                              }}
                              className="block w-full px-4 py-2.5 text-left text-sm text-emerald-700 transition hover:bg-emerald-50"
                            >
                              Activar
                            </button>
                          )}

                          {!user.correoVerificado && (
                            <button
                              type="button"
                              onClick={() => {
                                onResendActivation(user.id);
                                closeMenu();
                              }}
                              className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              Reenviar activación
                            </button>
                          )}
                        </div>,
                        document.body
                      )}
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