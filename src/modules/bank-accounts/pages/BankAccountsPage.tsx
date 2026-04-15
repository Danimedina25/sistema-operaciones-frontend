import { useMemo, useState } from 'react';
import { BankAccountsTable } from '@/modules/bank-accounts/components/BankAccountsTable';
import { BankAccountFormModal } from '@/modules/bank-accounts/components/BankAccountFormModal';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { useActivateBankAccount } from '@/modules/bank-accounts/hooks/use-activate-bank-account';
import { useDeactivateBankAccount } from '@/modules/bank-accounts/hooks/use-deactivate-bank-account';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import type { BankAccountFormValues } from '@/modules/bank-accounts/schemas/bank-account.schema';
import { useCreateBankAccount } from '../hooks/useCreateBankAccount';
import { useUpdateBankAccount } from '../hooks/useUpdateBankAccount';

export default function BankAccountsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountResponse | null>(null);

  const roles = ['ADMIN'];

  const canView = useMemo(
    () =>
      roles.some((role) =>
        ['ADMIN', 'GERENTE', 'AUXILIAR_CUENTAS', 'JEFA_CAJAS'].includes(role),
      ),
    [roles],
  );

  const canCreateOrEdit = useMemo(
    () =>
      roles.some((role) =>
        ['ADMIN', 'GERENTE', 'AUXILIAR_CUENTAS'].includes(role),
      ),
    [roles],
  );

  const canToggleStatus = useMemo(
    () => roles.some((role) => ['ADMIN', 'GERENTE'].includes(role)),
    [roles],
  );

  const { accounts, isLoading, loadBankAccounts, loadBankAccount } = useBankAccounts();

  const { isSubmitting: isCreating, submitCreateBankAccount } =
    useCreateBankAccount({
      onSuccess: async () => {
        await loadBankAccounts();
        setIsFormOpen(false);
      },
    });

  const { isSubmitting: isUpdating, submitUpdateBankAccount } =
    useUpdateBankAccount({
      onSuccess: async () => {
        await loadBankAccounts();
        setEditingAccount(null);
        setIsFormOpen(false);
      },
    });

  const {
    processingAccountId: activatingAccountId,
    submitActivateBankAccount,
  } = useActivateBankAccount({
    onSuccess: loadBankAccounts,
  });

  const {
    processingAccountId: deactivatingAccountId,
    submitDeactivateBankAccount,
  } = useDeactivateBankAccount({
    onSuccess: loadBankAccounts,
  });

  const processingAccountId = activatingAccountId ?? deactivatingAccountId;
  const isSubmitting = isCreating || isUpdating;

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (account: BankAccountResponse) => {
    try {
      const result = await loadBankAccount(account.id);
      setEditingAccount(result);
      setIsFormOpen(true);
    } catch {
      // el error ya se maneja en el hook
    }
  };

  const handleCloseForm = () => {
    if (isSubmitting) return;

    setIsFormOpen(false);
    setEditingAccount(null);
  };

  const handleSubmit = async (values: BankAccountFormValues) => {
    if (editingAccount) {
      await submitUpdateBankAccount(editingAccount.id, values);
      return;
    }

    await submitCreateBankAccount(values);
  };

  if (!canView) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No tienes permisos para acceder al módulo de cuentas bancarias.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Cuentas bancarias
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Registro, listado y edición de cuentas bancarias.
            </p>
          </div>

          {canCreateOrEdit && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Nueva cuenta
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Cargando cuentas bancarias...
        </div>
      ) : (
        <BankAccountsTable
          accounts={accounts}
          processingAccountId={processingAccountId}
          canEdit={canCreateOrEdit}
          canToggleStatus={canToggleStatus}
          onEdit={handleOpenEdit}
          onActivate={submitActivateBankAccount}
          onDeactivate={submitDeactivateBankAccount}
        />
      )}

      <BankAccountFormModal
        open={isFormOpen}
        mode={editingAccount ? 'edit' : 'create'}
        initialData={editingAccount}
        isSubmitting={isSubmitting}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}