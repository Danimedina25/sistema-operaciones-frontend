import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { PeriodSelector } from '@/shared/components/ui/PeriodSelector';
import { SearchFilterBar } from '@/shared/components/ui/SearchFilterBar';
import { Tabs } from '@/shared/components/ui/Tabs';
import { QueryState } from '@/shared/components/ui/QueryState';
import { formatMoney, formatPeriod } from '@/shared/format';
import { getPresetRange, selectionFromDates, type PeriodSelection } from '@/shared/utils/period';
import { getSummaryByBeneficiary } from '../api/commercial-partner-commissions.api';
import { CommissionBeneficiariesTable } from '../components/CommissionBeneficiariesTable';
import { PayBeneficiaryCommissionsModal } from '../components/PayBeneficiaryCommissionsModal';
import { BeneficiaryCommissionDetailModal } from '../components/BeneficiaryCommissionDetailModal';
import { usePayBeneficiaryCommissions } from '../hooks/use-pay-beneficiary-commissions';
import { useBeneficiaryCommissionDetail } from '../hooks/use-beneficiary-commission-detail';
import type { CommissionPartnerSummaryResponse } from '../types/commercial-partner-commissions.types';

type Tab = 'pending' | 'paid' | 'all';
const initialPeriod = () => { const range = getPresetRange('LAST_WEEK'); return selectionFromDates(range.startDate, range.endDate, 'LAST_WEEK'); };

export default function CommercialPartnerCommissionsPage() {
  const { hasRole } = useAuth();
  const canManagePayments = hasRole(['ADMIN', 'GERENTE']);
  const [period, setPeriod] = useState<PeriodSelection>(initialPeriod);
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<CommissionPartnerSummaryResponse | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const client = useQueryClient();
  const monthRange = getPresetRange('THIS_MONTH');
  const summary = useQuery({ queryKey: ['commissions', 'beneficiaries', period.startDate, period.endDate],
    queryFn: () => getSummaryByBeneficiary({ startDate: period.startDate, endDate: period.endDate }) });
  const month = useQuery({ queryKey: ['commissions', 'beneficiaries', monthRange.startDate, monthRange.endDate],
    queryFn: () => getSummaryByBeneficiary(monthRange) });
  const { isLoading: isPaying, handlePayBeneficiaryCommissions } = usePayBeneficiaryCommissions();
  const { detail, isLoading: loadingDetail, fetchDetail, clearDetail } = useBeneficiaryCommissionDetail();
  const beneficiaries = summary.data?.socios ?? [];
  const pendingCount = beneficiaries.filter(row => row.commissionIdsToPay?.length > 0).length;
  const filtered = beneficiaries.filter(row =>
    (tab === 'all' || (tab === 'pending' ? row.commissionIdsToPay?.length > 0 : row.estatus === 'PAGADA'))
    && (!search.trim() || row.nombre.toLocaleLowerCase('es-MX').includes(search.trim().toLocaleLowerCase('es-MX'))));
  const viewDetail = async (row: CommissionPartnerSummaryResponse) => {
    setDetailOpen(true);
    await fetchDetail({ beneficiaryId: row.beneficiaryId, beneficiaryType: row.beneficiaryType,
      startDate: period.startDate, endDate: period.endDate });
  };
  return <div className="space-y-5">
    <PageHeader title="Comisiones" actions={!canManagePayments ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Solo consulta</span> : undefined} />
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">Por pagar</p><strong className="mt-2 block text-xl text-amber-900">{formatMoney(summary.data?.totalPendientes ?? 0)}</strong><p className="mt-1 text-xs text-amber-800">{pendingCount} beneficiarios · periodo seleccionado</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pagado este mes</p><strong className="mt-2 block text-xl text-slate-900">{formatMoney(month.data?.totalPagadas ?? 0)}</strong></div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Generado este mes</p><strong className="mt-2 block text-xl text-slate-900">{formatMoney(month.data?.totalComisiones ?? 0)}</strong></div>
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <Tabs label="Estado de comisiones" value={tab} onChange={value => setTab(value as Tab)} options={[
          { value: 'pending', label: 'Por pagar ' + pendingCount }, { value: 'paid', label: 'Pagadas' }, { value: 'all', label: 'Todas' },
        ]} />
        <PeriodSelector compact allowAll={false} value={period} onApply={setPeriod} />
      </div>
      <SearchFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar beneficiario"
        filters={<p className="text-sm text-slate-600">Selecciona la semana o el rango con el selector de periodo.</p>} />
      <QueryState isLoading={summary.isPending} error={summary.error} onRetry={() => void summary.refetch()} loadingLabel="Cargando comisiones…">
        <CommissionBeneficiariesTable beneficiaries={filtered} onPayBeneficiary={row => { setSelectedPartner(row); setPayOpen(true); }}
          onViewDetail={row => { void viewDetail(row); }} canManagePayments={canManagePayments}
          periodLabel={formatPeriod(period.startDate, period.endDate)} />
      </QueryState>
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Las comisiones se pagan por transferencia cada sábado. Cada pago aparece como salida de la cuenta origen en Cortes y movimientos.</p>
    </section>
    <PayBeneficiaryCommissionsModal open={payOpen} beneficiary={selectedPartner} startDate={period.startDate} endDate={period.endDate}
      isSubmitting={isPaying} onClose={() => setPayOpen(false)}
      onSubmit={async (file, accountId) => {
        if (!selectedPartner) return;
        await handlePayBeneficiaryCommissions(selectedPartner.commissionIdsToPay, file, accountId);
        setPayOpen(false);
        await client.invalidateQueries({ queryKey: ['commissions', 'beneficiaries'] });
      }} />
    <BeneficiaryCommissionDetailModal open={detailOpen} detail={detail} isLoading={loadingDetail}
      onClose={() => { setDetailOpen(false); clearDetail(); }} startDate={period.startDate} endDate={period.endDate} />
  </div>;
}
