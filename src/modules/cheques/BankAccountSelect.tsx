import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBankAccounts } from '@/modules/bank-accounts/api/bank-accounts.api';
import { formatBankAccountLabel, normalizeForSearch } from '@/shared/utils/bank-account-label';

/** Mismos tokens que el resto de los formularios del sistema. */
const fieldLabel = 'mb-2 block text-sm font-medium text-slate-700';
const fieldControl = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60';

export function BankAccountSelect({ value, onChange, disabled = false, historicalLabel }: { value: number | null; onChange: (id: number | null) => void; disabled?: boolean; historicalLabel?: string | null }) {
  const [search, setSearch] = useState('');
  const accounts = useQuery({ queryKey: ['cheque-bank-accounts'], queryFn: getBankAccounts });
  const active = accounts.data?.filter(a => a.activo) ?? [];
  const selected = accounts.data?.find(a => a.id === value);

  return <div className="space-y-3">
    {value ? (
      <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
        Cuenta seleccionada: {selected ? formatBankAccountLabel(selected) : historicalLabel ?? value}
      </p>
    ) : null}

    <div>
      <label htmlFor="cheque-account-search" className={fieldLabel}>Buscar cuenta</label>
      <input
        id="cheque-account-search"
        className={fieldControl}
        value={search}
        disabled={disabled}
        onChange={e => { setSearch(e.target.value); onChange(null); }}
        placeholder="Banco, titular o número"
      />
    </div>

    {accounts.isPending ? (
      <p className="text-sm text-slate-500">Cargando cuentas…</p>
    ) : accounts.isError ? (
      <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
        No fue posible cargar cuentas.{' '}
        <button type="button" onClick={() => void accounts.refetch()} className="font-semibold underline">Reintentar</button>
      </p>
    ) : (
      <div>
        <label htmlFor="cheque-account" className={fieldLabel}>Cuenta bancaria</label>
        <select
          id="cheque-account"
          className={fieldControl}
          value={value ?? ''}
          disabled={disabled}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Selecciona una cuenta</option>
          {selected && !selected.activo && <option value={selected.id} disabled>{formatBankAccountLabel(selected)} (inactiva)</option>}
          {active.filter(a => a.id === value || normalizeForSearch(formatBankAccountLabel(a)).includes(normalizeForSearch(search))).map(a => <option key={a.id} value={a.id}>{formatBankAccountLabel(a)}</option>)}
        </select>
      </div>
    )}

    {!accounts.isPending && !accounts.isError && !active.some(a => normalizeForSearch(formatBankAccountLabel(a)).includes(normalizeForSearch(search))) && (
      <p className="text-sm text-slate-500">No se encontraron cuentas activas.</p>
    )}

    {selected && !selected.activo && (
      <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
        Selecciona una cuenta activa para continuar.
      </p>
    )}
  </div>;
}
