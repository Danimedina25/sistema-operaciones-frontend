import { useQuery } from '@tanstack/react-query';
import { getBankAccounts } from '@/modules/bank-accounts/api/bank-accounts.api';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';

export function BankAccountSelect({ value, onChange, disabled = false, historicalLabel }: { value: number | null; onChange: (id: number | null) => void; disabled?: boolean; historicalLabel?: string | null }) {
  const accounts = useQuery({ queryKey: ['cheque-bank-accounts'], queryFn: getBankAccounts });
  const selected = accounts.data?.find(a => a.id === value);

  return <div className="space-y-2">
    <BankAccountCombobox
      label="Cuenta bancaria"
      accounts={accounts.data ?? []}
      value={value}
      onChange={onChange}
      placeholder="Busca por banco, titular o número…"
      disabled={disabled}
      isLoading={accounts.isPending}
      loadError={accounts.isError ? 'No fue posible cargar cuentas.' : null}
      onlyActive
      clearSelectionOnInput
    />
    {accounts.isError && <button type="button" onClick={() => void accounts.refetch()} className="text-xs font-semibold text-blue-600 hover:underline">Reintentar carga de cuentas</button>}
    {value !== null && !selected && historicalLabel && !accounts.isPending && (
      <p className="text-xs text-slate-500">Cuenta registrada: {historicalLabel}</p>
    )}
    {selected && !selected.activo && (
      <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
        Selecciona una cuenta activa para continuar.
      </p>
    )}
  </div>;
}
