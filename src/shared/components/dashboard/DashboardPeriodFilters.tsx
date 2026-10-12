import { PeriodSelector } from '@/shared/components/ui/PeriodSelector';
import { getPresetRange, officeToday, selectionFromDates, type PeriodPreset } from '@/shared/utils/period';
import type { DashboardPeriod } from '@/modules/gerente/utils/period-range';

export interface DashboardPeriodFilterValue { period: DashboardPeriod; customStart: string; customEnd: string }

const DASHBOARD_PRESETS: readonly DashboardPeriod[] = [
  'TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH',
  'LAST_3_MONTHS', 'LAST_6_MONTHS', 'THIS_YEAR', 'LAST_YEAR',
];

export function DashboardPeriodFilters({ value, onChange, executive = false }: {
  value: DashboardPeriodFilterValue; onChange: (next: DashboardPeriodFilterValue) => void; executive?: boolean;
}) {
  const preset = value.period === 'CUSTOM' ? undefined : value.period as PeriodPreset;
  const range = preset ? getPresetRange(preset) : {
    startDate: value.customStart || officeToday(), endDate: value.customEnd || officeToday(),
  };
  return <PeriodSelector compact allowAll={false} extendedPresets={executive}
    value={{ ...selectionFromDates(range.startDate, range.endDate, preset), preset }}
    onApply={selection => {
      const nextPeriod = selection.preset && DASHBOARD_PRESETS.includes(selection.preset as DashboardPeriod)
        ? selection.preset as DashboardPeriod : 'CUSTOM';
      onChange({ period: nextPeriod, customStart: selection.startDate, customEnd: selection.endDate });
    }} />;
}
