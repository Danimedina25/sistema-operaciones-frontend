import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { USER_ROLE_OPTIONS } from '@/modules/users/constants/user-roles';
import {
  createUserSchema,
  type CreateUserFormInput,
  type CreateUserFormValues,
} from '@/modules/users/schemas/create-user.schema';

interface CreateUserFormProps {
  isSubmitting: boolean;
  onSubmit: (values: CreateUserFormValues) => Promise<void>;
}

export function CreateUserForm({
  isSubmitting,
  onSubmit,
}: CreateUserFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormInput, unknown, CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      nombre: '',
      correo: '',
      roleId: '' as unknown as number,
      roleName: '',
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
    setValue('roleName', selectedRole?.name ?? '', {
      shouldValidate: true,
      shouldDirty: false,
    });

    if (!isSocioComercial) {
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
          Correo
        </label>
        <Input
          type="email"
          placeholder="usuario@sistema.com"
          error={errors.correo?.message}
          {...register('correo')}
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

        {errors.roleId && (
          <p className="mt-1 text-xs text-red-600">
            {errors.roleId.message}
          </p>
        )}
      </div>

      {isSocioComercial && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cuenta bancaria del socio comercial
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={18}
              placeholder="CLABE interbancaria"
              {...register('cuentaBancaria')}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Banco del socio comercial
            </label>
            <Input
              placeholder="Nombre del banco"
              error={errors.banco?.message}
              {...register('banco')}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Titular de la cuenta del socio comercial
            </label>
            <Input
              placeholder="Nombre del titular"
              error={errors.titularCuenta?.message}
              {...register('titularCuenta')}
            />
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Crear usuario
        </Button>
      </div>
    </form>
  );
}