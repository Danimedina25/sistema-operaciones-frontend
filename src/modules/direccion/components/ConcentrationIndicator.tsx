import { AlertTriangle } from 'lucide-react';
import { calculateConcentration, isAboveConcentrationThreshold } from '@/shared/utils/concentration';
import type { CommissionPartnerSummaryResponse } from '@/modules/comisionessocioscomerciales/types/commercial-partner-commissions.types';

const CONCENTRATION_WARNING_THRESHOLD = 40;

interface ConcentrationIndicatorProps {
  socios: CommissionPartnerSummaryResponse[];
  isLoading: boolean;
}

export function ConcentrationIndicator({ socios, isLoading }: ConcentrationIndicatorProps) {
  const result = calculateConcentration(
    socios.map((socio) => ({ id: socio.beneficiaryId, amount: socio.montoOperado })),
  );

  const isConcentrated = isAboveConcentrationThreshold(result, CONCENTRATION_WARNING_THRESHOLD);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Indicador de concentración</h2>
        <p className="text-xs text-slate-500">Del volumen operado en el periodo seleccionado.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Calculando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className={`rounded-xl border p-4 ${
              isConcentrated ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Principal socio
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {result.topEntryPercent.toFixed(1)}%
            </p>
            {isConcentrated && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Supera el umbral de {CONCENTRATION_WARNING_THRESHOLD}%
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Top 3 socios (acumulado)
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {result.topThreePercent.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
