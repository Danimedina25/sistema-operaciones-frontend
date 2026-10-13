// src/modules/configuraciones/pages/ConfiguracionesPage.tsx

import { ConfiguracionGeneralForm } from '@/modules/configuraciones/components/ConfiguracionGeneralForm';
import { useConfiguracionGeneral } from '@/modules/configuraciones/hooks/use-configuracion-general';
import { useUpdateConfiguracionGeneral } from '@/modules/configuraciones/hooks/use-update-configuracion-general';
import { PageHeader } from '@/shared/components/layout/PageHeader';

export default function ConfiguracionesPage() {
  const { configuracionGeneral, isLoading, fetchConfiguracionGeneral } =
    useConfiguracionGeneral();

  const { isSubmitting, submitUpdateConfiguracionGeneral } =
    useUpdateConfiguracionGeneral({
      onSuccess: fetchConfiguracionGeneral,
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" />

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
