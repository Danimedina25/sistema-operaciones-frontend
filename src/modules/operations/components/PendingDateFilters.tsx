import { PeriodSelector } from '@/shared/components/ui/PeriodSelector';
import { selectionFromDateFilters } from '@/shared/utils/period';
import type { SocioPendingSummaryParams } from '../hooks/use-socio-pending-summary';

export function PendingDateFilters({ filters, onChange, label }: {
  filters: SocioPendingSummaryParams;
  onChange: (next: SocioPendingSummaryParams) => void;
  label: string;
}) {
  return <section aria-label={label} className="rounded-2xl bg-white p-4 shadow-sm">
    <PeriodSelector label={label} value={selectionFromDateFilters(filters)}
      onApply={({ startDate, endDate }) => onChange({ dateFilter: '', startDate, endDate })} />
  </section>;
}
