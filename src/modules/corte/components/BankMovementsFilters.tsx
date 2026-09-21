import { useMemo } from 'react';
import { TableFilterSection } from '@/shared/components/ui/TableFilterSection';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import { fieldControl } from '@/shared/styles/ui-tokens';
import { BANK_MOVEMENT_TYPES, type BankMovementSideFilters } from '../types/bank-movements.types';

/** El campo del sistema, con el margen que pide ir dentro de un `<label>`. */
const field = `mt-1 ${fieldControl}`;

/** El periodo no se captura aquí: vive en la cabecera compartida de Cortes y saldos. */
export function BankMovementsFilters({ filters, onChange, accounts, isLoadingAccounts }: {
  filters: BankMovementSideFilters;
  onChange: (next: BankMovementSideFilters) => void;
  accounts: BankAccountResponse[];
  isLoadingAccounts: boolean;
}) {
  const banks = useMemo(
    () => Array.from(new Set(accounts.map(account => account.banco))).sort(),
    [accounts],
  );

  function set<K extends keyof BankMovementSideFilters>(key: K, value: BankMovementSideFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <TableFilterSection title="Filtros">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Histórico: las cuentas inactivas siguen siendo consultables. */}
        <BankAccountCombobox
          label="Cuenta bancaria"
          accounts={accounts}
          value={filters.bankAccountId}
          onChange={value => set('bankAccountId', value)}
          isLoading={isLoadingAccounts}
          onlyActive={false}
          allowEmpty
          emptyLabel="Todas las cuentas"
        />

        <label className="block text-sm font-medium text-slate-700">Banco
          <select value={filters.banco} className={field} onChange={event => set('banco', event.target.value)}>
            <option value="">Todos</option>
            {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">Dirección
          <select value={filters.direccion} className={field}
            onChange={event => set('direccion', event.target.value as BankMovementSideFilters['direccion'])}>
            <option value="">Todas</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">Tipo
          <select value={filters.tipo} className={field}
            onChange={event => set('tipo', event.target.value as BankMovementSideFilters['tipo'])}>
            <option value="">Todos</option>
            {Object.entries(BANK_MOVEMENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
    </TableFilterSection>
  );
}
