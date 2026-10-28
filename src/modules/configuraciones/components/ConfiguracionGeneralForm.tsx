import { useFormSubmission } from '@/shared/hooks/use-form-submission';
// src/modules/configuraciones/components/ConfiguracionGeneralForm.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Clock3, Percent } from 'lucide-react';
import { formatPercent } from '@/shared/format';

import {
  updateConfiguracionGeneralSchema,
  type UpdateConfiguracionGeneralFormInput,
  type UpdateConfiguracionGeneralFormValues,
} from '@/modules/configuraciones/schemas/update-configuracion-general.schema';

interface ConfiguracionGeneralFormProps {
  isSubmitting: boolean;
  initialValues?: {
    porcentajeComisionOficina: number;
    horasPendienteAtencion: number;
    horasPendienteUrgente: number;
  };
  onSubmit: (values: UpdateConfiguracionGeneralFormValues) => Promise<unknown>;
}

function formValues(values: ConfiguracionGeneralFormProps['initialValues']): UpdateConfiguracionGeneralFormInput {
  return {
    porcentajeComisionOficina: values?.porcentajeComisionOficina.toFixed(2),
    horasPendienteAtencion: values?.horasPendienteAtencion != null ? String(values.horasPendienteAtencion) : undefined,
    horasPendienteUrgente: values?.horasPendienteUrgente != null ? String(values.horasPendienteUrgente) : undefined,
  };
}

export function ConfiguracionGeneralForm({
  isSubmitting,
  initialValues,
  onSubmit,
}: ConfiguracionGeneralFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    UpdateConfiguracionGeneralFormInput,
    unknown,
    UpdateConfiguracionGeneralFormValues
  >({
    resolver: zodResolver(updateConfiguracionGeneralSchema),
    defaultValues: formValues(initialValues),
    mode: 'onChange',
  });

  useEffect(() => {
    if (initialValues) {
      reset(formValues(initialValues));
    }
  }, [initialValues, reset]);

  const { submit, busy, submitError } = useFormSubmission(onSubmit, isSubmitting);

  return (
    <form className="max-w-[640px] space-y-3 rounded-xl border border-slate-200 bg-white p-7 shadow-sm" onSubmit={handleSubmit(submit)}>
      {submitError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
      <fieldset disabled={busy} className="min-w-0 space-y-3">
      <div>
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Percent size={16} /></span>
          <div><h3 className="text-sm font-semibold text-slate-900">Comisión de oficina</h3>
            <p className="mt-0.5 text-xs text-slate-500">Porcentaje que se aplica por defecto a cada operación nueva.</p></div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="porcentaje-comision-oficina">Porcentaje de comisión de oficina</label>
          <div className="relative w-40">
            <Input id="porcentaje-comision-oficina" type="text" inputMode="decimal"
              className="pr-9" placeholder="Ej. 1.50"
              error={errors.porcentajeComisionOficina?.message}
              {...register('porcentajeComisionOficina')} />
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 text-sm text-slate-500">%</span>
          </div>
          <p className="text-xs text-slate-500">Antes: {formatPercent(initialValues?.porcentajeComisionOficina)}</p>
        </div>
        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">Las operaciones ya creadas conservan su porcentaje. El cambio solo aplica a las nuevas.</p>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><Clock3 size={16} /></span>
          <div><h3 className="text-sm font-semibold text-slate-900">Semáforo de pendientes</h3>
            <p className="mt-0.5 text-xs text-slate-500">Horas desde el pendiente más antiguo de cada grupo. Aplica igual a todos los perfiles.</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="horas-pendiente-atencion"><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-amber-500" />Atender pronto desde</label>
            <div className="relative">
              <Input id="horas-pendiente-atencion" type="text" inputMode="numeric" className="pr-9"
                error={errors.horasPendienteAtencion?.message} {...register('horasPendienteAtencion')} />
              <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 text-sm text-slate-500">h</span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="horas-pendiente-urgente"><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-red-500" />Urgente desde</label>
            <div className="relative">
              <Input id="horas-pendiente-urgente" type="text" inputMode="numeric" className="pr-9"
                error={errors.horasPendienteUrgente?.message} {...register('horasPendienteUrgente')} />
              <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 text-sm text-slate-500">h</span>
            </div>
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Sin pendientes se marca en verde. Antes de la primera hora no se marca alerta.</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="neutral" type="button" onClick={() => reset(formValues(initialValues))}>Descartar</Button>
        <Button variant="primary" type="submit" isLoading={busy}>
          Guardar cambios
        </Button>
      </div>
      </fieldset>
    </form>
  );
}
