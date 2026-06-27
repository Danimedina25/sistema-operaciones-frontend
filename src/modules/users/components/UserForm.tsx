import { useEffect, useMemo, useRef, useState } from 'react';
import { MEXICAN_BANKS } from '@/modules/bank-accounts/components/BankAccountFormModal';
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

  const [showBankOptions, setShowBankOptions] =
    useState(false);

  const bankFieldValue =
    watch('banco') || '';

  const bankContainerRef =
    useRef<HTMLDivElement | null>(null);

  const filteredBanks = useMemo(() => {
    const search =
      bankFieldValue.trim().toLowerCase();

    if (!search) {
      return MEXICAN_BANKS;
    }
    return MEXICAN_BANKS.filter((bank) => {
      return (
        bank.value.toLowerCase().includes(search) ||
        bank.label.toLowerCase().includes(search)
      );
    });
  }, [bankFieldValue]);

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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Información del usuario
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Actualiza los datos generales del usuario.
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

            <div
              ref={bankContainerRef}
              className="relative"
            >
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Banco
              </label>

              <input
                type="text"
                {...register('banco')}
                onFocus={() => setShowBankOptions(true)}
                onChange={(e) => {
                  setValue('banco', e.target.value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  setShowBankOptions(true);
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                placeholder="Busca o selecciona un banco"
                autoComplete="off"
              />

              {showBankOptions && (
                <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {filteredBanks.length > 0 ? (
                    filteredBanks.map((bank) => (
                      <button
                        key={bank.value}
                        type="button"
                        onClick={() => {
                          setValue('banco', bank.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });

                          setShowBankOptions(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        {bank.label}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      No se encontraron bancos
                    </div>
                  )}
                </div>
              )}

              {errors.banco && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.banco.message}
                </p>
              )}
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
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}