import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BankAccountStatusBadge } from '@/modules/bank-accounts/components/BankAccountStatusBadge';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';

interface BankAccountsTableProps {
  accounts: BankAccountResponse[];
  processingAccountId: number | null;
  canEdit: boolean;
  canToggleStatus: boolean;
  onEdit: (account: BankAccountResponse) => void;
  onActivate: (accountId: number) => void | Promise<void>;
  onDeactivate: (accountId: number) => void | Promise<void>;
}

export function BankAccountsTable({
  accounts,
  processingAccountId,
  canEdit,
  canToggleStatus,
  onEdit,
  onActivate,
  onDeactivate,
}: BankAccountsTableProps) {
  const [openMenuAccountId, setOpenMenuAccountId] = useState<number | null>(null);
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
        setOpenMenuAccountId(null);
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
      setOpenMenuAccountId(null);
      setMenuPosition(null);
    }

    window.addEventListener('scroll', handleCloseMenu, true);
    window.addEventListener('resize', handleCloseMenu);

    return () => {
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('resize', handleCloseMenu);
    };
  }, []);

  const closeMenu = () => {
    setOpenMenuAccountId(null);
    setMenuPosition(null);
  };

  const handleToggleMenu = (
    accountId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (openMenuAccountId === accountId) {
      closeMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const estimatedMenuHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedMenuHeight;

    setMenuPosition({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left: Math.max(8, rect.right - menuWidth),
      openUp,
    });

    setOpenMenuAccountId(accountId);
  };

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No hay cuentas bancarias registradas.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-600">
              <th className="px-4 py-3 font-medium">Banco</th>
              <th className="px-4 py-3 font-medium">Titular</th>
              <th className="px-4 py-3 font-medium">Número de cuenta</th>
              <th className="px-4 py-3 font-medium">CLABE</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Actualizada</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {accounts.map((account) => {
              const isProcessing = processingAccountId === account.id;
              const isMenuOpen = openMenuAccountId === account.id;

              return (
                <tr
                  key={account.id}
                  className="border-t border-slate-200 text-sm"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {account.banco}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {account.titular}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {account.numeroCuenta}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {account.clabe}
                  </td>

                  <td className="px-4 py-4">
                    <BankAccountStatusBadge active={account.activo} />
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {new Date(account.updatedAt).toLocaleString('es-MX')}
                  </td>

                  <td className="px-4 py-4 text-right">
                    {(canEdit || canToggleStatus) && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={(event) => handleToggleMenu(account.id, event)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {isProcessing ? 'Procesando...' : 'Opciones'}
                      </button>
                    )}

                    {isMenuOpen &&
                      menuPosition &&
                      createPortal(
                        <div
                          ref={menuRef}
                          className="fixed z-[9999] w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                          style={{
                            top: menuPosition.top,
                            left: menuPosition.left,
                            transform: menuPosition.openUp
                              ? 'translateY(-100%)'
                              : 'none',
                          }}
                        >
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                onEdit(account);
                                closeMenu();
                              }}
                              className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              Editar
                            </button>
                          )}

                          {canToggleStatus && account.activo && (
                            <button
                              type="button"
                              onClick={() => {
                                void onDeactivate(account.id);
                                closeMenu();
                              }}
                              className="block w-full px-4 py-2.5 text-left text-sm text-red-700 transition hover:bg-red-50"
                            >
                              Desactivar
                            </button>
                          )}

                          {canToggleStatus && !account.activo && (
                            <button
                              type="button"
                              onClick={() => {
                                void onActivate(account.id);
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