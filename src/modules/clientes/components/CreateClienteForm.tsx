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
      porcentajeComisionSocio: 0,
      porcentajeComisionOficina: 1.5,
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
          Porcentaje de comisión por socio comercial
        </label>
        <Input
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="Ej. 1.00"
          error={errors.porcentajeComisionSocio?.message}
          {...register('porcentajeComisionSocio')}
        />
        <p className="mt-1 text-xs text-slate-500">
          Este porcentaje se aplica a cada socio comercial que participe en una operación de este cliente.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Porcentaje de comisión para oficina
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

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Crear cliente
        </Button>
      </div>
    </form>
  );
}
