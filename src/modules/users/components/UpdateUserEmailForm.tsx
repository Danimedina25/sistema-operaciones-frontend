import { useId } from 'react';
import { ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { useFormSubmission } from '@/shared/hooks/use-form-submission';
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
  onCancel?: () => void;
  onSubmit: (values: UpdateUserEmailFormValues) => Promise<void>;
  initialCorreo?: string;
}

export function UpdateUserEmailForm({
  isSubmitting,
  onCancel,
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

  const formId = useId();
  const { submit, busy, submitError } = useFormSubmission(onSubmit, isSubmitting);

  return (
    <form id={formId} className="space-y-5" onSubmit={handleSubmit(submit)}>
      {submitError && <p role="alert" className="sticky top-0 z-10 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
      <fieldset disabled={busy} className="min-w-0 space-y-5">

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

      </fieldset>
      <ActionDrawerFooter>
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        {onCancel && <Button type="button" variant="neutral" disabled={busy} onClick={onCancel}>Cancelar</Button>}
        <Button variant="primary" type="submit" form={formId} isLoading={busy}>
          Actualizar correo
        </Button>
      </div>
      </ActionDrawerFooter>
    </form>
  );
}