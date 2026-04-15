import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { OperationStatusBadge } from '@/modules/operations/components/OperationStatusBadge';
import {
  formatCurrency,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../types/operations.types.ts';


interface OperationsTableProps {
  operations: PaymentOperationResponse[];
  onViewDetail: (id: number) => void;
  onAddPayment: (id: number) => void;
}

export function OperationsTable({
  operations,
  onViewDetail,
  onAddPayment,
}: OperationsTableProps) {
  const [openMenuOperationId, setOpenMenuOperationId] = useState<number | null>(null);
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
        setOpenMenuOperationId(null);
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
      setOpenMenuOperationId(null);
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
    operationId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (openMenuOperationId === operationId) {
      setOpenMenuOperationId(null);
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

    setOpenMenuOperationId(operationId);
  }

  function closeMenu() {
    setOpenMenuOperationId(null);
    setMenuPosition(null);
  }

  if (operations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No hay operaciones registradas con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-600">
              <th className="px-4 py-3 font-medium text-center">Cliente</th>
              <th className="px-4 py-3 font-medium text-center">Socio comercial</th>
              <th className="px-4 py-3 font-medium text-center">Monto total</th>
              <th className="px-4 py-3 font-medium text-center">Pagos registrados</th>
              <th className="px-4 py-3 font-medium text-center">Red comercial</th>
              <th className="px-4 py-3 font-medium text-center">Estatus</th>
              <th className="px-4 py-3 font-medium text-center">Creada</th>
              <th className="px-4 py-3 font-medium text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {operations.map((operation) => {
              const isMenuOpen = openMenuOperationId === operation.id;

              return (
                <tr
                  key={operation.id}
                  className="border-t border-slate-200 text-sm"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    <div>{operation.clienteNombre}</div>
                    <div className="mt-1 text-xs font-normal text-slate-400">
                      #{operation.id}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {operation.socioComercialNombre}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {formatCurrency(operation.montoTotal)}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    <div>
                      {operation.pagos.length} pago
                      {operation.pagos.length === 1 ? '' : 's'} registrado
                      {operation.pagos.length === 1 ? '' : 's'}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {formatCurrency(operation.montoValidado)} validados
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    <div>{operation.nivelesRedComercial} nivel{operation.nivelesRedComercial > 1 ? 'es' : ''}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {operation.porcentajeComisionAplicado}%
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <OperationStatusBadge status={operation.estatus} />
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {formatDateTime(operation.createdAt)}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={(event) => handleToggleMenu(operation.id, event)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Opciones
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
                                onViewDetail(operation.id);
                                closeMenu();
                              }}
                              className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              Ver detalle
                            </button>

                            { operation.estatus !== 'VALIDADA' &&
                              <button
                                type="button"
                                onClick={() => {
                                  onAddPayment(operation.id);
                                  closeMenu();
                                }}
                                className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                Registrar pago
                              </button>
                            }
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