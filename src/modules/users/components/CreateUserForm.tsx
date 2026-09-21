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
import { BankCombobox } from '@/shared/components/ui/BankCombobox';

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
      telefono: '',
      roleId: '' as unknown as number,
      roleName: '',
      appliesToNetwork: true,
      porcentajeComision: undefined,
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
    <form
      className="space-y-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Información del usuario */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Información del usuario
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Datos básicos para crear el usuario dentro del sistema.
          </p>
        </div>

        <div className="space-y-5">
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
                <option
                  key={role.id}
                  value={role.id}
                >
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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Teléfono
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="10 dígitos"
              {...register('telefono')}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(
                  /\D/g,
                  '',
                );
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
            />

            <p className="mt-1 text-xs text-slate-500">
              Se usa para enviar avisos por WhatsApp.
            </p>

            {errors.telefono && (
              <p className="mt-1 text-xs text-red-600">
                {errors.telefono.message}
              </p>
            )}
          </div>
        </div>
      </div>
      {isSocioComercial && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Información bancaria
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Cuenta donde se depositarán las comisiones del socio comercial.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                CLABE interbancaria
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={18}
                placeholder="18 dígitos"
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

            <BankCombobox
              label="Banco"
              value={String(watch('banco') ?? '')}
              onChange={bank => setValue('banco', bank, { shouldDirty: true, shouldValidate: true })}
              fieldError={errors.banco?.message}
            />

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

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Porcentaje de comisión sugerido
              </label>

              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Ej. 5.00"
                error={errors.porcentajeComision?.message}
                {...register('porcentajeComision')}
              />
              <p className="mt-1 text-xs text-slate-500">Se copiará como valor inicial al crear operaciones y podrá ajustarse por operación.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          Crear usuario
        </Button>
      </div>
    </form>
  );
}
