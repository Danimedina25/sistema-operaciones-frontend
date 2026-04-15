import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import {
  updateUserEmailSchema,
  type UpdateUserEmailFormValues,
} from '@/modules/users/schemas/update-user-email.schema';

interface UpdateUserEmailFormProps {
  isSubmitting: boolean;
  onSubmit: (values: UpdateUserEmailFormValues) => Promise<void>;
  initialCorreo?: string;
}

export function UpdateUserEmailForm({
  isSubmitting,
  onSubmit,
  initialCorreo,
}: UpdateUserEmailFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateUserEmailFormValues>({
    resolver: zodResolver(updateUserEmailSchema),
    defaultValues: {
      correo: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    reset({
      correo: initialCorreo ?? '',
    });
  }, [initialCorreo, reset]);

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nuevo correo
        </label>
        <Input
          type="email"
          placeholder="usuario@sistema.com"
          error={errors.correo?.message}
          {...register('correo')}
        />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
        Al actualizar el correo, el sistema enviará el flujo correspondiente de
        validación al nuevo email.
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isSubmitting}>
          Actualizar correo
        </Button>
      </div>
    </form>
  );
}