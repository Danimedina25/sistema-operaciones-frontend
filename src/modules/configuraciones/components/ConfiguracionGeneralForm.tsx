// src/modules/configuraciones/components/ConfiguracionGeneralForm.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

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
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Comisión de oficina
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Porcentaje de comisión de oficina aplicado por defecto en las
            operaciones nuevas.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Porcentaje de comisión de oficina
          </label>

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
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <Button type="submit" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
