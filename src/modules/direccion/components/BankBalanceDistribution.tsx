import { useEffect, useState } from 'react';
import { calculateBankBalancesGrouped } from '@/modules/corte/api/corte.api';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import type { BankGroupBalanceResponse } from '@/modules/corte/types/corte.types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Saldo bancario actual (no depende del periodo del dashboard — es un
 * corte del momento, igual que "Cortes y saldos").
 */
export function BankBalanceDistribution() {
  const [balances, setBalances] = useState<BankGroupBalanceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    calculateBankBalancesGrouped()
      .then((result) => {
        if (!cancelled) setBalances(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalSaldo = balances.reduce((sum, bank) => sum + bank.saldoTotalBanco, 0);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Distribución de saldos por banco</h2>
        <p className="text-xs text-slate-500">Saldo actual, reutilizando Cortes y saldos.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando saldos...</p>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          No se pudieron cargar los saldos bancarios.
        </div>
      ) : balances.length === 0 ? (
        <EmptyState title="Sin cuentas bancarias registradas" />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium">Banco</th>
                <th className="px-4 py-3 font-medium">Cuentas</th>
                <th className="px-4 py-3 font-medium">Saldo total</th>
                <th className="px-4 py-3 font-medium">% del saldo total</th>
              </tr>
            </thead>
            <tbody>
              {[...balances]
                .sort((a, b) => b.saldoTotalBanco - a.saldoTotalBanco)
                .map((bank) => {
                  const percent = totalSaldo > 0 ? (bank.saldoTotalBanco / totalSaldo) * 100 : 0;

                  return (
                    <tr key={bank.banco} className="border-t border-slate-100 text-sm">
                      <td className="px-4 py-3 text-slate-900">{bank.banco}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{bank.totalCuentas}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                        {formatCurrency(bank.saldoTotalBanco)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{percent.toFixed(1)}%</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
