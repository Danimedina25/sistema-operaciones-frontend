import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBankAccounts } from '@/modules/bank-accounts/api/bank-accounts.api';
import { formatBankAccountLabel, normalizeForSearch } from '@/shared/utils/bank-account-label';
export function BankAccountSelect({ value, onChange, disabled = false, historicalLabel }: { value: number | null; onChange: (id: number | null) => void; disabled?: boolean; historicalLabel?: string | null }) {
  const [search, setSearch] = useState('');
  const accounts = useQuery({ queryKey: ['cheque-bank-accounts'], queryFn: getBankAccounts });
  const active = accounts.data?.filter(a => a.activo) ?? [];
  const selected = accounts.data?.find(a => a.id === value);
  return <div className="space-y-2">
    {value && <p className="text-sm">Cuenta seleccionada: {selected ? formatBankAccountLabel(selected) : historicalLabel ?? value}</p>}
    <label className="block">Buscar cuenta<input className="block w-full rounded border p-2" value={search} disabled={disabled} onChange={e => { setSearch(e.target.value); onChange(null); }} placeholder="Banco, titular o número" /></label>
    {accounts.isPending ? <p>Cargando cuentas…</p> : accounts.isError ? <p role="alert">No fue posible cargar cuentas. <button type="button" onClick={() => void accounts.refetch()}>Reintentar</button></p> : <label className="block">Cuenta bancaria<select className="block w-full rounded border p-2" value={value ?? ''} disabled={disabled} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">Selecciona una cuenta</option>
      {selected && !selected.activo && <option value={selected.id} disabled>{formatBankAccountLabel(selected)} (inactiva)</option>}
      {active.filter(a => a.id === value || normalizeForSearch(formatBankAccountLabel(a)).includes(normalizeForSearch(search))).map(a => <option key={a.id} value={a.id}>{formatBankAccountLabel(a)}</option>)}
    </select></label>}
    {!accounts.isPending && !accounts.isError && !active.some(a => normalizeForSearch(formatBankAccountLabel(a)).includes(normalizeForSearch(search))) && <p>No se encontraron cuentas activas.</p>}
    {selected && !selected.activo && <p role="alert">Selecciona una cuenta activa para continuar.</p>}
  </div>;
}
