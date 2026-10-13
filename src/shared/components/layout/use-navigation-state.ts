import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { cajaGeneralApi } from '@/modules/caja-general/api/caja-general.api';
import { cashWorkApi } from '@/modules/caja-general/api/cash-work.api';
import { bankWorkApi } from '@/modules/corte/api/bank-work.api';
import { getSummaryByBeneficiary } from '@/modules/comisionessocioscomerciales/api/commercial-partner-commissions.api';
import type { RoleName } from '@/modules/auth/types/auth.types';

function previousWeekInOffice(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (part: string) => Number(parts.find(item => item.type === part)?.value);
  const sunday = new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
  sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay() - 7);
  const saturday = new Date(sunday);
  saturday.setUTCDate(saturday.getUTCDate() + 6);
  return { startDate: sunday.toISOString().slice(0, 10), endDate: saturday.toISOString().slice(0, 10) };
}

export function useNavigationState(role: RoleName | undefined) {
  const { user } = useAuth();
  const isCash = role === 'JEFA_CAJAS';
  const isBank = role === 'JEFA_CUENTAS' || role === 'AUXILIAR_CUENTAS';
  const isManager = role === 'GERENTE';
  const commissionWeek = previousWeekInOffice(new Date());
  const cashWork = useQuery({
    queryKey: ['cash-work', 'summary'],
    queryFn: cashWorkApi.summary,
    enabled: isCash,
    refetchInterval: 30_000,
  });
  const bankWork = useQuery({
    queryKey: ['bank-work', 'summary'],
    queryFn: bankWorkApi.summary,
    enabled: isBank,
    refetchInterval: 30_000,
  });
  const commissions = useQuery({
    queryKey: ['navigation', user?.userId, 'commissions', commissionWeek],
    queryFn: () => getSummaryByBeneficiary(commissionWeek),
    enabled: isManager,
    refetchInterval: 30_000,
  });
  const cashDay = useQuery({
    queryKey: ['caja-general', user?.userId, 'latest'],
    queryFn: cajaGeneralApi.latest,
    enabled: isCash,
    refetchInterval: 30_000,
  });

  return {
    counts: {
      cashIncome: cashWork.data?.income.count ?? null,
      cashOutflow: cashWork.data?.outflow.count ?? null,
      bankIncome: bankWork.data?.income.count ?? null,
      bankOutflow: bankWork.data?.outflow.count ?? null,
      commissions: commissions.data?.socios.filter(socio => socio.totalPendientes > 0 && socio.totalComisionesPendientes > 0).length ?? null,
    },
    cashOpen: cashDay.data ? !cashDay.data.closedAt : false,
    cashStateKnown: cashDay.isSuccess,
  };
}

export { previousWeekInOffice };
