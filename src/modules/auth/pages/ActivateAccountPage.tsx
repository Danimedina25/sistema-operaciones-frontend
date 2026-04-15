import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import {
  activateAccountSchema,
  type ActivateAccountFormValues,
} from '@/modules/auth/schemas/activate-account.schema';
import { useCompleteActivation } from '@/modules/auth/hooks/use-complete-activation';

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { submitActivation, isSubmitting } = useCompleteActivation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateAccountFormValues>({
    resolver: zodResolver(activateAccountSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const hasToken = useMemo(() => token.trim().length > 0, [token]);

  const onSubmit = async (values: ActivateAccountFormValues) => {
    if (!hasToken) return;

    await submitActivation(token, values.password);
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden flex-1 items-center justify-center bg-slate-900 px-10 lg:flex">
        <div className="max-w-lg text-white">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-bold leading-tight">
            Activación de cuenta
          </h1>

          <p className="mt-4 text-base text-slate-300">
            Define tu contraseña para activar tu cuenta y comenzar a utilizar el
            sistema de operaciones financieras.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Activar cuenta</h2>
            <p className="mt-2 text-sm text-slate-500">
              Crea tu contraseña para completar el proceso de activación.
            </p>
          </div>

          {!hasToken ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              El enlace de activación no es válido o no contiene token.
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirmar contraseña
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Activar cuenta
              </Button>
            </form>
          )}

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
            El enlace de activación expira según la vigencia configurada en el sistema.
          </div>
        </div>
      </div>
    </div>
  );
}