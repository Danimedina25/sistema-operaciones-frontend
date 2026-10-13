// src/modules/configuraciones/components/ConfiguracionGeneralForm.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Percent } from 'lucide-react';

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
      porcentajeComisionOficina: initialValues?.porcentajeComisionOficina,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        porcentajeComisionOficina: initialValues.porcentajeComisionOficina,
      });
    }
  }, [initialValues, reset]);

  return (
    <form className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Percent size={16} /></span>
          <div><h3 className="text-sm font-semibold text-slate-900">Comisión de oficina</h3>
            <p className="mt-0.5 text-xs text-slate-500">Porcentaje que se aplica por defecto a cada operación nueva.</p></div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-700">Porcentaje de comisión de oficina</label>

          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="Ej. 1.50"
            error={errors.porcentajeComisionOficina?.message}
            {...register('porcentajeComisionOficina')}
          />
        </div>
        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">Las operaciones ya creadas conservan su porcentaje. El cambio solo se aplica a las nuevas.</p>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="neutral" type="button" onClick={() => reset({ porcentajeComisionOficina: initialValues?.porcentajeComisionOficina })}>Descartar</Button>
        <Button variant="primary" type="submit" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
