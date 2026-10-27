import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BankAccountsTable } from '@/modules/bank-accounts/components/BankAccountsTable';
import { AccountMovementsModal } from '@/modules/bank-accounts/components/AccountMovementsModal';
import { BankAccountFormModal } from '@/modules/bank-accounts/components/BankAccountFormModal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { DeleteConfirmationModal } from '@/shared/components/ui/DeleteConfirmationModal';
import { SearchFilterBar } from '@/shared/components/ui/SearchFilterBar';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/shared/format';
import { officeToday } from '@/shared/utils/period';
import { calculateBankBalancesGrouped, calculateDailyCashCut } from '@/modules/corte/api/corte.api';
import { bankWorkApi } from '@/modules/corte/api/bank-work.api';
import { useAuth } from '@/modules/auth/store/auth.context';

import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { useActivateBankAccount } from '@/modules/bank-accounts/hooks/use-activate-bank-account';
import { useDeactivateBankAccount } from '@/modules/bank-accounts/hooks/use-deactivate-bank-account';
import { useDeleteBankAccount } from '@/modules/bank-accounts/hooks/use-delete-bank-account';
import { useCreateBankAccount } from '../hooks/useCreateBankAccount';
import { useUpdateBankAccount } from '../hooks/useUpdateBankAccount';

import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import type { BankAccountFormValues } from '@/modules/bank-accounts/schemas/bank-account.schema';

import {
  filterBankAccounts,
  type BankAccountsFilters as BankAccountsFiltersType,
} from '@/modules/bank-accounts/utils/bank-accounts-filters';

import { getTotalPages, paginateItems } from '@/shared/utils/pagination';
import { useTableFilters } from '@/shared/hooks/use-table-filters';

const initialFilters: BankAccountsFiltersType = {
  search: '',
  status: 'ACTIVE',
};

export default function BankAccountsPage() {
  const { filters, setFilters } = useTableFilters('table-filters:bank-accounts', initialFilters);

  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<BankAccountResponse | null>(null);
  const [deletingAccount, setDeletingAccount] =
    useState<BankAccountResponse | null>(null);
  const [movementsAccount, setMovementsAccount] = useState<BankAccountResponse | null>(null);

  const pageSize = 10;

  const { hasRole } = useAuth();
  const canDelete = hasRole('ADMIN');
  const canView = hasRole(['ADMIN', 'GERENTE', 'DIRECCION', 'JEFA_CUENTAS', 'AUXILIAR_CUENTAS']);
  const canCreate = hasRole(['ADMIN', 'GERENTE', 'JEFA_CUENTAS']);
  const canEdit = hasRole(['ADMIN', 'GERENTE']);
  const canToggleStatus = hasRole(['ADMIN', 'GERENTE']);

  const { accounts, isLoading, loadBankAccounts, loadBankAccount } =
    useBankAccounts();
  const today = officeToday();
  const balancesQuery = useQuery({ queryKey: ['bank-balances-grouped', today], queryFn: () => calculateBankBalancesGrouped(today) });
  const cutQuery = useQuery({ queryKey: ['daily-cash-cut', today], queryFn: () => calculateDailyCashCut(today) });
  const transitQuery = useQuery({ queryKey: ['bank-work', 'summary'], queryFn: bankWorkApi.summary });
  const balances = useMemo(() => new Map(balancesQuery.data?.flatMap(group => group.cuentas.map(account => [account.bankAccountId, account.saldoFinal] as const)) ?? []), [balancesQuery.data]);

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

  const { processingAccountId: activatingAccountId, submitActivateBankAccount } =
    useActivateBankAccount({
      onSuccess: loadBankAccounts,
    });

  const {
    processingAccountId: deactivatingAccountId,
    submitDeactivateBankAccount,
  } = useDeactivateBankAccount({
    onSuccess: loadBankAccounts,
  });

  const { isDeleting, submitDeleteBankAccount } = useDeleteBankAccount({
    onSuccess: loadBankAccounts,
  });

  const processingAccountId = activatingAccountId ?? deactivatingAccountId;
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredAccounts = useMemo(() => {
    return filterBankAccounts(accounts, filters);
  }, [accounts, filters]);

  const totalPages = useMemo(() => {
    return getTotalPages(filteredAccounts.length, pageSize);
  }, [filteredAccounts.length, pageSize]);

  const paginatedAccounts = useMemo(() => {
    return paginateItems(filteredAccounts, currentPage, pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

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
    <div className="mx-4 space-y-6 pt-2">
      <PageHeader title="Cuentas bancarias y saldos" actions={canCreate ? <Button variant="dark" className="h-10 rounded-xl px-4" onClick={handleOpenCreate}><Plus className="h-4 w-4" />Nueva cuenta</Button> : undefined} />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-950 px-6 py-5 text-white"><p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Saldo total en cuentas</p><p className="mt-2 text-3xl font-bold tabular-nums">{cutQuery.data ? formatMoney(cutQuery.data.saldoFinal) : '—'}</p><p className="mt-1 text-xs text-slate-400">Saldo confirmado del corte bancario</p></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900"><p className="text-xs font-semibold uppercase tracking-[.12em] text-amber-700">Retiros en tránsito</p><p className="mt-2 text-3xl font-bold tabular-nums">{transitQuery.data ? formatMoney(transitQuery.data.withdrawalsInTransit.amount) : '—'}</p><p className="mt-1 text-xs text-amber-700">{transitQuery.data?.withdrawalsInTransit.count ?? '—'} {transitQuery.data?.withdrawalsInTransit.count === 1 ? 'retiro' : 'retiros'} por confirmar en Caja General</p></div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-1 shadow-sm">
        <SearchFilterBar search={filters.search} onSearchChange={search => setFilters(current => ({ ...current, search }))}
          searchPlaceholder="Buscar por titular, número de cuenta o CLABE"
          activeFilters={filters.status !== 'ACTIVE' ? [{ key: 'status', label: filters.status === 'INACTIVE' ? 'Inactivas' : 'Todas', onRemove: () => setFilters(current => ({ ...current, status: 'ACTIVE' })) }] : []}
          filters={<label className="block max-w-xs text-sm font-medium text-slate-700">Mostrar
            <select aria-label="Mostrar cuentas" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value as BankAccountsFiltersType['status'] }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"><option value="ACTIVE">Activas</option><option value="INACTIVE">Inactivas</option><option value="ALL">Todas</option></select>
          </label>} />

      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm [&_td]:py-3">
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Cargando cuentas bancarias...
        </div>
      ) : (
        <>
          <BankAccountsTable
            accounts={paginatedAccounts}
            balances={balances}
            processingAccountId={processingAccountId}
            canEdit={canEdit}
            canToggleStatus={canToggleStatus}
            canDelete={canDelete}
            onEdit={handleOpenEdit}
            onActivate={submitActivateBankAccount}
            onDeactivate={submitDeactivateBankAccount}
            onDelete={setDeletingAccount}
            onViewMovements={setMovementsAccount}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>Mostrando {paginatedAccounts.length} de {filteredAccounts.length} cuentas</span><strong className="text-slate-900">Saldo total {cutQuery.data ? formatMoney(cutQuery.data.saldoFinal) : '—'} · {transitQuery.data ? formatMoney(transitQuery.data.withdrawalsInTransit.amount) : '—'} en tránsito</strong></div>
          {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} totalElements={filteredAccounts.length} isLoading={isLoading} onPageChange={setCurrentPage} />}
        </>
      )}
      </div>

      <BankAccountFormModal
        open={isFormOpen}
        mode={editingAccount ? 'edit' : 'create'}
        initialData={editingAccount}
        isSubmitting={isSubmitting}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />
      <AccountMovementsModal account={movementsAccount} onClose={() => setMovementsAccount(null)} />

      <DeleteConfirmationModal
        open={Boolean(deletingAccount)}
        title={`Estás a punto de eliminar definitivamente la cuenta "${deletingAccount?.banco ?? ''} - ${deletingAccount?.titular ?? ''}".`}
        isSubmitting={isDeleting}
        onClose={() => setDeletingAccount(null)}
        onConfirm={async () => {
          if (!deletingAccount) return;
          const ok = await submitDeleteBankAccount(deletingAccount.id);
          if (ok) setDeletingAccount(null);
        }}
      />
    </div>
  );
}
