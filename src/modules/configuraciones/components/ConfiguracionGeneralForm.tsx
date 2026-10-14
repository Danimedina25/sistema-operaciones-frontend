// src/modules/configuraciones/components/ConfiguracionGeneralForm.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Percent } from 'lucide-react';
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
  };
  onSubmit: (values: UpdateConfiguracionGeneralFormValues) => Promise<unknown>;
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
    defaultValues: {
      porcentajeComisionOficina: initialValues?.porcentajeComisionOficina.toFixed(2),
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        porcentajeComisionOficina: initialValues.porcentajeComisionOficina.toFixed(2),
      });
    }
  }, [initialValues, reset]);

  return (
    <form className="max-w-[640px] space-y-3 rounded-xl border border-slate-200 bg-white p-7 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
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

      <div className="flex justify-end gap-2">
        <Button variant="neutral" type="button" onClick={() => reset({ porcentajeComisionOficina: initialValues?.porcentajeComisionOficina.toFixed(2) })}>Descartar</Button>
        <Button variant="dark" type="submit" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
