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
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!initialValues) {
      reset({
        nombre: '',
        activo: true,
      });

      return;
    }

    reset({
      nombre: initialValues.nombre,
      activo: initialValues.activo ?? true,
    });
  }, [
    initialValues?.nombre,
    initialValues?.activo,
    reset,
  ]);

  const handleFormSubmit = async (values: UpdateClienteFormValues) => {
    await onSubmit(values);

    reset(values);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(handleFormSubmit)}>
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
