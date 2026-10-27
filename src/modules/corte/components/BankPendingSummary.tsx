import { BankPendingTaskCard } from './BankPendingTaskCard';
import { useCardlessPending } from '@/modules/operations/hooks/returns/use-cardless-pending';
import { useQuery } from '@tanstack/react-query';
import { paths } from '@/routes/paths';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { QueryState } from '@/shared/components/ui/QueryState';
import { bankWorkApi } from '../api/bank-work.api';
import { cashBankDepositsApi } from '@/modules/cash-bank-deposits/api';
import { useAuth } from '@/modules/auth/store/auth.context';


export function BankPendingSummary() {
  const { hasRole } = useAuth();
  const seesDeposits = hasRole(['JEFA_CUENTAS', 'ADMIN']);
  const query = useQuery({ queryKey: ['bank-work', 'summary'], queryFn: bankWorkApi.summary });
  const deposits = useQuery({ queryKey: ['cash-bank-deposits', 'pending-summary'],
    queryFn: cashBankDepositsApi.summary, enabled: seesDeposits });
  const cardless = useCardlessPending();
  const cardlessCount = cardless.data ? new Set(cardless.data.map(task => task.requestId)).size : null;
  const count = query.data && (!seesDeposits || deposits.data)
    ? query.data.income.count + query.data.outflow.count + (seesDeposits ? deposits.data?.count ?? 0 : 0) : null;
  return <div className="space-y-5">
    <div><PageHeader title="Mis pendientes" /><p className="mt-0.5 text-sm text-slate-500">{count === null ? 'Cargando pendientes de Cuentas…' : `${count} pendientes`}</p></div>
    <QueryState isLoading={query.isPending || (seesDeposits && deposits.isPending)}
      error={query.error || deposits.error}
      onRetry={() => { void query.refetch(); if (seesDeposits) void deposits.refetch(); }}
      loadingLabel="Cargando pendientes de Cuentas…">
      {query.data && <div className="grid gap-5 md:grid-cols-3">
        <BankPendingTaskCard label="Ingresos de operaciones para validar" total={query.data.income} to={paths.bankIncome} action="Ir a Entradas › Pagos de ingreso" kind="income" unit={query.data.income.count === 1 ? 'pago' : 'pagos'} />
        <BankPendingTaskCard label="Retornos de operaciones para pagar" total={query.data.outflow} to={paths.bankOutflow} action="Ir a Salidas › Retornos" kind="outflow" unit={query.data.outflow.count === 1 ? 'solicitud' : 'solicitudes'}>
          <div className="mb-4 space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-600" aria-label="Retornos por método">
            {cardless.error ? <p role="alert">No se pudo cargar el desglose. <button className="underline" onClick={() => void cardless.refetch()}>Reintentar</button></p> : cardlessCount === null ? <p>Cargando desglose por método…</p> : <>
              <p className="flex justify-between gap-3"><span>Transferencias</span><strong className="tabular-nums text-slate-900">{Math.max(0, query.data.outflow.count - cardlessCount)}</strong></p>
              <p className="flex justify-between gap-3"><span>Retiros sin tarjeta</span><strong className="tabular-nums text-slate-900">{cardlessCount}</strong></p>
            </>}
          </div>
        </BankPendingTaskCard>
        {seesDeposits && deposits.data &&
          <BankPendingTaskCard label="Envíos desde Caja por confirmar" total={deposits.data}
            to={`${paths.bankIncome}?view=deposits`} action="Ir a Entradas › Envíos"
            kind="income" unit={deposits.data.count === 1 ? 'envío' : 'envíos'} />}
      </div>}
    </QueryState>
  </div>;
}
