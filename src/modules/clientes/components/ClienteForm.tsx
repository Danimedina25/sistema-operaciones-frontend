import { useId } from 'react';
import { ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { useFormSubmission } from '@/shared/hooks/use-form-submission';
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
  onCancel?: () => void;
  onSubmit: (values: UpdateClienteFormValues) => Promise<void>;
  submitLabel: string;
  initialValues?: {
    nombre: string;
    activo?: boolean;
  };
}

export function ClienteForm({
  isSubmitting,
  onCancel,
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

  const formId = useId();
  const { submit, busy, submitError } = useFormSubmission(handleFormSubmit, isSubmitting);

  return (
    <form id={formId} className="space-y-5" onSubmit={handleSubmit(submit)}>
      {submitError && <p role="alert" className="sticky top-0 z-10 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
      <fieldset disabled={busy} className="min-w-0 space-y-5">

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

      </fieldset>
      <ActionDrawerFooter>
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && <Button type="button" variant="neutral" disabled={busy} onClick={onCancel}>Cancelar</Button>}
        <Button variant="primary" type="submit" form={formId} isLoading={busy}>
          {submitLabel}
        </Button>
      </div>
      </ActionDrawerFooter>
    </form>
  );
}
