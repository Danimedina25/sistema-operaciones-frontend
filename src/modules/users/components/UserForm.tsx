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
    appliesToNetwork?: boolean;
    cuentaBancaria?: string;
    banco?: string;
    titularCuenta?: string;
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
      appliesToNetwork: true,
      cuentaBancaria: '',
      banco: '',
      titularCuenta: '',
    },
    mode: 'onBlur',
  });

  const selectedRoleId = watch('roleId');

  const roleName = watch('roleName');

  const selectedRole = USER_ROLE_OPTIONS.find(
    (role) => role.id === Number(selectedRoleId),
  );

  const isSocioComercial =
    roleName === 'SOCIO_COMERCIAL';

  useEffect(() => {
    if (initialValues) {
      reset({
        nombre: initialValues.nombre,
        roleId: initialValues.roleId as unknown as number,
        roleName: initialValues.roleName ?? '',
        activo: initialValues.activo ?? true,
        appliesToNetwork: initialValues.appliesToNetwork ?? true,
        cuentaBancaria: initialValues.cuentaBancaria ?? '',
        banco: initialValues.banco ?? '',
        titularCuenta: initialValues.titularCuenta ?? '',
      });
      return;
    }

    reset({
      nombre: '',
      roleId: '' as unknown as number,
      roleName: '',
      activo: true,
      appliesToNetwork: true,
    });
  }, [initialValues, reset]);
  useEffect(() => {
    if (!selectedRole) {
      return;
    }

    setValue(
      'roleName',
      selectedRole.name,
      {
        shouldValidate: true,
        shouldDirty: false,
      },
    );

    if (!isSocioComercial) {
      setValue(
        'appliesToNetwork',
        true,
        {
          shouldValidate: false,
          shouldDirty: false,
        },
      );

      setValue(
        'cuentaBancaria',
        '',
        {
          shouldValidate: false,
          shouldDirty: false,
        },
      );

      setValue(
        'banco',
        '',
        {
          shouldValidate: false,
          shouldDirty: false,
        },
      );

      setValue(
        'titularCuenta',
        '',
        {
          shouldValidate: false,
          shouldDirty: false,
        },
      );
    }
  }, [
    selectedRole,
    isSocioComercial,
    setValue,
  ]);

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
              Cuenta bancaria
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={18}
              placeholder="CLABE interbancaria"
              {...register('cuentaBancaria')}
              onInput={(e) => {
                e.currentTarget.value =
                  e.currentTarget.value.replace(/\D/g, '');
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
            />

            {errors.cuentaBancaria && (
              <p className="mt-1 text-xs text-red-600">
                {errors.cuentaBancaria.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Banco
            </label>

            <Input
              placeholder="Nombre del banco"
              error={errors.banco?.message}
              {...register('banco')}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Titular de la cuenta
            </label>

            <Input
              placeholder="Nombre del titular"
              error={errors.titularCuenta?.message}
              {...register('titularCuenta')}
            />
          </div>
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