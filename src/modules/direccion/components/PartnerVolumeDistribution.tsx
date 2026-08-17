import { EmptyState } from '@/shared/components/ui/EmptyState';
import type { CommissionPartnerSummaryResponse } from '@/modules/comisionessocioscomerciales/types/commercial-partner-commissions.types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

interface PartnerVolumeDistributionProps {
  socios: CommissionPartnerSummaryResponse[];
  isLoading: boolean;
}

export function PartnerVolumeDistribution({ socios, isLoading }: PartnerVolumeDistributionProps) {
  const totalVolumen = socios.reduce((sum, socio) => sum + socio.montoOperado, 0);
  const sorted = [...socios].sort((a, b) => b.montoOperado - a.montoOperado);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Distribución del volumen por socio</h2>
        <p className="text-xs text-slate-500">Periodo seleccionado.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando distribución...</p>
      ) : sorted.length === 0 ? (
        <EmptyState title="Sin actividad en este periodo" />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium">Socio</th>
                <th className="px-4 py-3 font-medium">Monto operado</th>
                <th className="px-4 py-3 font-medium">Operaciones</th>
                <th className="px-4 py-3 font-medium">% del volumen total</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((socio) => {
                const percent = totalVolumen > 0 ? (socio.montoOperado / totalVolumen) * 100 : 0;

                return (
                  <tr key={socio.beneficiaryId} className="border-t border-slate-100 text-sm">
                    <td className="px-4 py-3 text-slate-900">{socio.nombre}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {formatCurrency(socio.montoOperado)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">{socio.totalOperaciones}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-600">{percent.toFixed(1)}%</span>
                      </div>
                    </td>
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
