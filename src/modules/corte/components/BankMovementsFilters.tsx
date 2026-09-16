import { useMemo } from 'react';
import { TableFilterSection } from '@/shared/components/ui/TableFilterSection';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import { BANK_MOVEMENT_TYPES, type BankMovementFilters } from '../types/bank-movements.types';
import { todayIso } from '../hooks/use-bank-movements';

const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

export function BankMovementsFilters({ filters, onChange, accounts, isLoadingAccounts }: {
  filters: BankMovementFilters;
  onChange: (next: BankMovementFilters) => void;
  accounts: BankAccountResponse[];
  isLoadingAccounts: boolean;
}) {
  const today = todayIso();
  const banks = useMemo(
    () => Array.from(new Set(accounts.map(account => account.banco))).sort(),
    [accounts],
  );

  function set<K extends keyof BankMovementFilters>(key: K, value: BankMovementFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <TableFilterSection title="Filtros">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm font-medium text-slate-700">Desde
          {/* No se consultan fechas futuras: no existen movimientos por venir. */}
          <input type="date" max={today} value={filters.desde} className={field}
            onChange={event => set('desde', event.target.value)} />
        </label>

        <label className="block text-sm font-medium text-slate-700">Hasta
          <input type="date" max={today} value={filters.hasta} className={field}
            onChange={event => set('hasta', event.target.value)} />
        </label>

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
            onChange={event => set('direccion', event.target.value as BankMovementFilters['direccion'])}>
            <option value="">Todas</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">Tipo
          <select value={filters.tipo} className={field}
            onChange={event => set('tipo', event.target.value as BankMovementFilters['tipo'])}>
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
