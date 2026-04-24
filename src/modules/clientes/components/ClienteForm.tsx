import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import {
  updateClienteSchema,
  type UpdateClienteFormInput,
  type UpdateClienteFormValues,
} from '@/modules/clientes/schemas/update-cliente.schema';

interface ClienteFormProps {
  isSubmitting: boolean;
  onSubmit: (values: UpdateClienteFormValues) => Promise<void>;
  submitLabel: string;
  initialValues?: {
    nombre: string;
    activo?: boolean;
    nivelesRedComercial: number;
    porcentajeComisionAplicado: number;
  };
}

export function ClienteForm({
  isSubmitting,
  onSubmit,
  submitLabel,
  initialValues,
}: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateClienteFormInput, unknown, UpdateClienteFormValues>({
    resolver: zodResolver(updateClienteSchema),
    defaultValues: {
      nombre: '',
      activo: true,
      nivelesRedComercial: 1,
      porcentajeComisionAplicado: 0,
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        nombre: initialValues.nombre,
        activo: initialValues.activo ?? true,
        nivelesRedComercial: initialValues.nivelesRedComercial,
        porcentajeComisionAplicado: initialValues.porcentajeComisionAplicado,
      });
      return;
    }

    reset({
      nombre: '',
      activo: true,
      nivelesRedComercial: 1,
      porcentajeComisionAplicado: 0,
    });
  }, [initialValues, reset]);

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nombre del cliente
        </label>
        <Input
          placeholder="Ej. Cliente primario"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Niveles de red comercial
        </label>
        <select
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          {...register('nivelesRedComercial')}
        >
          <option value="">Selecciona niveles</option>
          <option value="1">1 nivel</option>
          <option value="2">2 niveles</option>
          <option value="3">3 niveles</option>
        </select>

        {errors.nivelesRedComercial ? (
          <p className="mt-1 text-xs text-red-600">
            {errors.nivelesRedComercial.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Porcentaje de comisión por nivel
        </label>
        <Input
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="Ej. 1.00"
          error={errors.porcentajeComisionAplicado?.message}
          {...register('porcentajeComisionAplicado')}
        />
        <p className="mt-1 text-xs text-slate-500">
          Este porcentaje se multiplicará por los niveles de red comercial.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300"
          {...register('activo')}
        />
        Cliente activo
      </label>

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}