// src/modules/configuraciones/pages/ConfiguracionesPage.tsx

import { ConfiguracionGeneralForm } from '@/modules/configuraciones/components/ConfiguracionGeneralForm';
import { useConfiguracionGeneral } from '@/modules/configuraciones/hooks/use-configuracion-general';
import { useUpdateConfiguracionGeneral } from '@/modules/configuraciones/hooks/use-update-configuracion-general';

export default function ConfiguracionesPage() {
  const { configuracionGeneral, isLoading, fetchConfiguracionGeneral } =
    useConfiguracionGeneral();

  const { isSubmitting, submitUpdateConfiguracionGeneral } =
    useUpdateConfiguracionGeneral({
      onSuccess: fetchConfiguracionGeneral,
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Configuraciones
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ajustes generales del sistema.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Cargando configuración...
        </div>
      ) : (
        <ConfiguracionGeneralForm
          isSubmitting={isSubmitting}
          initialValues={
            configuracionGeneral
              ? {
                  porcentajeComisionOficina:
                    configuracionGeneral.porcentajeComisionOficina,
                }
              : undefined
          }
          onSubmit={submitUpdateConfiguracionGeneral}
        />
      )}
    </div>
  );
}
