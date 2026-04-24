import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import type { ClienteResponse } from '@/modules/clientes/types/clientes.types';
import { ClienteStatusBadge } from './ClienteStatusBadge';

interface ClientesTableProps {
  clientes: ClienteResponse[];
  processingClienteId: number | null;
  onEdit: (cliente: ClienteResponse) => void;
  onActivate: (clienteId: number) => void;
  onDeactivate: (clienteId: number) => void;
}

export function ClientesTable({
  clientes,
  processingClienteId,
  onEdit,
  onActivate,
  onDeactivate,
}: ClientesTableProps) {
  const [openMenuClienteId, setOpenMenuClienteId] = useState<number | null>(
    null,
  );
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuClienteId(null);
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
      setOpenMenuClienteId(null);
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
    clienteId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (openMenuClienteId === clienteId) {
      setOpenMenuClienteId(null);
      setMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 208;
    const estimatedMenuHeight = 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedMenuHeight;

    setMenuPosition({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left: Math.max(8, rect.right - menuWidth),
      openUp,
    });

    setOpenMenuClienteId(clienteId);
  }

  function closeMenu() {
    setOpenMenuClienteId(null);
    setMenuPosition(null);
  }

  if (clientes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No se encontraron clientes con los filtros seleccionados.
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
              <th className="px-4 py-3 font-medium">Niveles</th>
              <th className="px-4 py-3 font-medium">Comisión</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {clientes.map((cliente) => {
              const isProcessing = processingClienteId === cliente.id;
              const isMenuOpen = openMenuClienteId === cliente.id;

              return (
                <tr
                  key={cliente.id}
                  className="border-t border-slate-200 text-sm"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {cliente.nombre}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {cliente.nivelesRedComercial} nivel
                    {cliente.nivelesRedComercial > 1 ? 'es' : ''}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {cliente.porcentajeComisionAplicado}%
                  </td>

                  <td className="px-4 py-4">
                    <ClienteStatusBadge active={cliente.activo} />
                  </td>

                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={(event) => handleToggleMenu(cliente.id, event)}
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
                              onEdit(cliente);
                              closeMenu();
                            }}
                            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          {cliente.activo ? (
                            <button
                              type="button"
                              onClick={() => {
                                onDeactivate(cliente.id);
                                closeMenu();
                              }}
                              className="block w-full px-4 py-2.5 text-left text-sm text-red-700 transition hover:bg-red-50"
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onActivate(cliente.id);
                                closeMenu();
                              }}
                              className="block w-full px-4 py-2.5 text-left text-sm text-emerald-700 transition hover:bg-emerald-50"
                            >
                              Activar
                            </button>
                          )}
                        </div>,
                        document.body,
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