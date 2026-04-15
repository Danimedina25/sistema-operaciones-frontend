import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { USER_ROLE_OPTIONS } from '@/modules/users/constants/user-roles';
import {
  updateUserSchema,
  type UpdateUserFormInput,
  type UpdateUserFormValues,
} from '@/modules/users/schemas/update-user.schema';

interface UserFormProps {
  isSubmitting: boolean;
  onSubmit: (values: UpdateUserFormValues) => Promise<void>;
  submitLabel: string;
  initialValues?: {
    nombre: string;
    roleId: number;
    activo?: boolean;
    roleName?: string;
    commissionPercentage?: number;
    appliesToNetwork?: boolean;
  };
}

export function UserForm({
  isSubmitting,
  onSubmit,
  submitLabel,
  initialValues,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateUserFormInput, unknown, UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      nombre: '',
      roleId: '' as unknown as number,
      roleName: '',
      activo: true,
      commissionPercentage: undefined,
      appliesToNetwork: true,
    },
    mode: 'onBlur',
  });

  const selectedRoleId = watch('roleId');

  const selectedRole = USER_ROLE_OPTIONS.find(
    (role) => role.id === Number(selectedRoleId),
  );

  const isSocioComercial = selectedRole?.name === 'SOCIO_COMERCIAL';

  useEffect(() => {
    if (initialValues) {
      reset({
        nombre: initialValues.nombre,
        roleId: initialValues.roleId as unknown as number,
        roleName: initialValues.roleName ?? '',
        activo: initialValues.activo ?? true,
        commissionPercentage: initialValues.commissionPercentage,
        appliesToNetwork: initialValues.appliesToNetwork ?? true,
      });
      return;
    }

    reset({
      nombre: '',
      roleId: '' as unknown as number,
      roleName: '',
      activo: true,
      commissionPercentage: undefined,
      appliesToNetwork: true,
    });
  }, [initialValues, reset]);

  useEffect(() => {
    setValue('roleName', selectedRole?.name ?? '', {
      shouldValidate: true,
      shouldDirty: false,
    });

    if (!isSocioComercial) {
      setValue('commissionPercentage', undefined, {
        shouldValidate: true,
        shouldDirty: false,
      });

      setValue('appliesToNetwork', true, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [selectedRole, isSocioComercial, setValue]);

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nombre
        </label>
        <Input
          placeholder="Nombre completo"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Rol
        </label>

        <select
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          {...register('roleId')}
        >
          <option value="">Selecciona un rol</option>
          {USER_ROLE_OPTIONS.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>

        {errors.roleId ? (
          <p className="mt-1 text-xs text-red-600">{errors.roleId.message}</p>
        ) : null}
      </div>

      {isSocioComercial && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Porcentaje de comisión
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              placeholder="Ej. 8.50"
              error={errors.commissionPercentage?.message}
              {...register('commissionPercentage')}
            />
            <p className="mt-1 text-xs text-slate-500">
              Este porcentaje se aplicará al socio comercial y a su red.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              {...register('appliesToNetwork')}
            />
            Aplicar a toda su red
          </label>
        </>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}