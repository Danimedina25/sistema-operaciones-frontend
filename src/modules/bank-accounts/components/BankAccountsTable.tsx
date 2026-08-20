import { BankAccountStatusBadge } from '@/modules/bank-accounts/components/BankAccountStatusBadge';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import { formatDate } from '@/modules/operations/utils/operation-formatters';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';

interface BankAccountsTableProps {
  accounts: BankAccountResponse[];
  processingAccountId: number | null;
  canEdit: boolean;
  canToggleStatus: boolean;
  canDelete: boolean;
  onEdit: (account: BankAccountResponse) => void;
  onActivate: (accountId: number) => void | Promise<void>;
  onDeactivate: (accountId: number) => void | Promise<void>;
  onDelete: (account: BankAccountResponse) => void;
}

export function BankAccountsTable({
  accounts,
  processingAccountId,
  canEdit,
  canToggleStatus,
  canDelete,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: BankAccountsTableProps) {
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
          <thead className="bg-slate-100">
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              <th className="px-4 py-3 font-medium">Banco</th>
              <th className="min-w-[160px] px-4 py-3 font-medium">Titular</th>
              <th className="min-w-[150px] px-4 py-3 font-medium">Número de cuenta</th>
              <th className="min-w-[170px] px-4 py-3 font-medium">CLABE</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="min-w-[120px] px-4 py-3 font-medium">Actualizada</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {accounts.map((account) => {
              const isProcessing = processingAccountId === account.id;

              return (
                <tr
                  key={account.id}
                  className="border-t border-slate-200 text-sm transition-colors hover:bg-blue-50/40"
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
                    {formatDate(account.updatedAt)}
                  </td>

                  <td className="px-4 py-4 text-right">
                    {(canEdit || canToggleStatus || canDelete) && (
                      <RowActionsMenu
                        triggerLabel={isProcessing ? 'Procesando...' : 'Opciones'}
                        triggerDisabled={isProcessing}
                      >
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(account)}
                            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>
                        )}

                        {canToggleStatus && account.activo && (
                          <button
                            type="button"
                            onClick={() => void onDeactivate(account.id)}
                            className="block w-full px-4 py-2.5 text-left text-sm font-semibold  text-red-700 transition hover:bg-red-50"
                          >
                            Desactivar
                          </button>
                        )}

                        {canToggleStatus && !account.activo && (
                          <button
                            type="button"
                            onClick={() => void onActivate(account.id)}
                            className="block w-full px-4 py-2.5 text-left text-sm font-semibold  text-emerald-700 transition hover:bg-emerald-50"
                          >
                            Activar
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(account)}
                            className="block w-full border-t border-red-100 bg-red-50/50 px-4 py-2.5 text-left text-sm font-bold text-red-900 transition hover:bg-red-100"
                          >
                            Eliminar definitivamente
                          </button>
                        )}
                      </RowActionsMenu>
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