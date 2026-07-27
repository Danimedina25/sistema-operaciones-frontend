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

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Crear cliente
        </Button>
      </div>
    </form>
  );
}
