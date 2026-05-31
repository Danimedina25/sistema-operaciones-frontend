// src/modules/socioscomerciales/components/CommercialPartnersTable.tsx

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { StatusBadge } from '@/shared/components/ui/StatusBadge';

import type {
  CommercialPartnerResponse,
} from '@/modules/socioscomerciales/types/socioscomerciales.types';

interface CommercialPartnersTableProps {
  commercialPartners: CommercialPartnerResponse[];
  processingPartnerId: number | null;
  onEdit: (partner: CommercialPartnerResponse) => void;
  onActivate: (partnerId: number) => void;
  onDeactivate: (partnerId: number) => void;
}

export function CommercialPartnersTable({
  commercialPartners,
  processingPartnerId,
  onEdit,
  onActivate,
  onDeactivate,
}: CommercialPartnersTableProps) {
  const [openMenuPartnerId, setOpenMenuPartnerId] =
    useState<number | null>(null);

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
        setOpenMenuPartnerId(null);
        setMenuPosition(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
    };
  }, []);

  function handleToggleMenu(
    partnerId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (openMenuPartnerId === partnerId) {
      setOpenMenuPartnerId(null);
      setMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 208;
    const estimatedMenuHeight = 180;

    const spaceBelow = window.innerHeight - rect.bottom;

    const openUp = spaceBelow < estimatedMenuHeight;

    setMenuPosition({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left: Math.max(8, rect.right - menuWidth),
      openUp,
    });

    setOpenMenuPartnerId(partnerId);
  }

  function closeMenu() {
    setOpenMenuPartnerId(null);
    setMenuPosition(null);
  }

  if (commercialPartners.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No se encontraron socios comerciales.
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
              <th className="px-4 py-3 font-medium">
                Cuenta bancaria
              </th>
              <th className="px-4 py-3 font-medium">Banco</th>
              <th className="px-4 py-3 font-medium">
                Titular
              </th>
              <th className="px-4 py-3 font-medium">
                Nivel
              </th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {commercialPartners.map((partner) => {
              const isProcessing =
                processingPartnerId === partner.id;

              const isMenuOpen =
                openMenuPartnerId === partner.id;

              return (
                <tr
                  key={partner.id}
                  className="border-t border-slate-200 text-sm"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {partner.nombre}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {partner.cuentaBancaria}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {partner.banco}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {partner.titularCuenta}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {partner.nivel}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge active={partner.activo} />
                  </td>

                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={(event) =>
                        handleToggleMenu(partner.id, event)
                      }
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {isProcessing
                        ? 'Procesando...'
                        : 'Opciones'}
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
                              onEdit(partner);
                              closeMenu();
                            }}
                            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          {partner.activo ? (
                            <button
                              type="button"
                              onClick={() => {
                                onDeactivate(partner.id);
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
                                onActivate(partner.id);
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