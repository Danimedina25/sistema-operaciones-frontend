import { useId } from 'react';
import { ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { useFormSubmission } from '@/shared/hooks/use-form-submission';
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
  onCancel?: () => void;
  levelOneUsers: Array<{ id: number; nombre: string }>;
  currentUserId: number;
  canAssignLevelOne: boolean;
  onSubmit: (values: CreateClienteFormValues) => Promise<void>;
}

export function CreateClienteForm({
  isSubmitting,
  onCancel,
  levelOneUsers,
  currentUserId,
  canAssignLevelOne,
  onSubmit,
}: CreateClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClienteFormInput, unknown, CreateClienteFormValues>({
    resolver: zodResolver(createClienteSchema),
    defaultValues: {
      userId: currentUserId,
      nombre: '',
    },
    mode: 'onBlur',
  });

  const formId = useId();
  const { submit, busy, submitError } = useFormSubmission(onSubmit, isSubmitting);

  return (
    <form id={formId} className="space-y-5" onSubmit={handleSubmit(submit)}>
      {submitError && <p role="alert" className="sticky top-0 z-10 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
      <fieldset disabled={busy} className="min-w-0 space-y-5">

      {canAssignLevelOne ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Socio comercial nivel 1 propietario</label>
          <select className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" {...register('userId')}>
            <option value="">Selecciona un socio comercial</option>
            {levelOneUsers.map((user) => <option key={user.id} value={user.id}>{user.nombre}</option>)}
          </select>
          {errors.userId ? <p className="mt-1 text-xs text-red-600">{errors.userId.message}</p> : null}
          <p className="mt-1 text-xs text-slate-500">El cliente quedará vinculado a este usuario como socio nivel 1.</p>
        </div>
      ) : (
        <input type="hidden" {...register('userId')} />
      )}
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

      </fieldset>
      <ActionDrawerFooter>
      <div className="flex gap-3 justify-end">
        {onCancel && <Button type="button" variant="neutral" disabled={busy} onClick={onCancel}>Cancelar</Button>}
        <Button variant="primary" type="submit" form={formId} isLoading={busy}>
          Crear cliente
        </Button>
      </div>
      </ActionDrawerFooter>
    </form>
  );
}
