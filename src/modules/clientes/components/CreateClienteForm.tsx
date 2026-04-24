import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import {
  createClienteSchema,
  type CreateClienteFormInput,
  type CreateClienteFormValues,
} from '@/modules/clientes/schemas/create-cliente.schema';

interface CreateClienteFormProps {
  isSubmitting: boolean;
  onSubmit: (values: CreateClienteFormValues) => Promise<void>;
}

export function CreateClienteForm({
  isSubmitting,
  onSubmit,
}: CreateClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClienteFormInput, unknown, CreateClienteFormValues>({
    resolver: zodResolver(createClienteSchema),
    defaultValues: {
      nombre: '',
      nivelesRedComercial: 1,
      porcentajeComisionAplicado: 0,
    },
    mode: 'onBlur',
  });

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

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Crear cliente
        </Button>
      </div>
    </form>
  );
}