// src/modules/socioscomerciales/components/CommercialPartnersTable.tsx

import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { CanAccess } from '@/shared/components/CanAccess';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';

import type {
  CommercialPartnerResponse,
} from '@/modules/socioscomerciales/types/socioscomerciales.types';

interface CommercialPartnersTableProps {
  commercialPartners: CommercialPartnerResponse[];
  processingPartnerId: number | null;
  onEdit: (partner: CommercialPartnerResponse) => void;
  onActivate: (partnerId: number) => void;
  onDeactivate: (partnerId: number) => void;
  onDelete: (partner: CommercialPartnerResponse) => void;
}

export function CommercialPartnersTable({
  commercialPartners,
  processingPartnerId,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: CommercialPartnersTableProps) {
  if (commercialPartners.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No se encontraron socios comerciales.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              <th className="min-w-[160px] px-4 py-3 font-medium">Nombre</th>
              <th className="min-w-[150px] px-4 py-3 font-medium">
                Cuenta bancaria
              </th>
              <th className="min-w-[120px] px-4 py-3 font-medium">Banco</th>
              <th className="min-w-[160px] px-4 py-3 font-medium">
                Titular
              </th>
              <th className="px-4 py-3 font-medium">Comisión</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {commercialPartners.map((partner) => {
              const isProcessing =
                processingPartnerId === partner.id;

              return (
                <tr
                  key={partner.id}
                  className="border-t border-slate-200 text-sm transition-colors hover:bg-blue-50/40"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {partner.nombre}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {partner.cuentaBancaria}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {partner.banco}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {partner.titularCuenta}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {partner.porcentajeComision}%
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge active={partner.activo} />
                  </td>

                  <td className="px-4 py-4 text-right">
                    <RowActionsMenu
                      triggerLabel={
                        isProcessing ? 'Procesando...' : 'Opciones'
                      }
                      triggerDisabled={isProcessing}
                    >
                      <button
                        type="button"
                        onClick={() => onEdit(partner)}
                        className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </button>

                      {partner.activo ? (
                        <button
                          type="button"
                          onClick={() => onDeactivate(partner.id)}
                          className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onActivate(partner.id)}
                          className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Activar
                        </button>
                      )}

                      <CanAccess roles={['ADMIN', 'DIRECCION']}>
                        <button
                          type="button"
                          onClick={() => onDelete(partner)}
                          className="block w-full border-t border-red-100 bg-red-50/50 px-4 py-2.5 text-left text-sm font-bold text-red-900 transition hover:bg-red-100"
                        >
                          Eliminar definitivamente
                        </button>
                      </CanAccess>
                    </RowActionsMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}