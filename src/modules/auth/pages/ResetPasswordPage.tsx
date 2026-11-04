import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { activateAccountSchema, type ActivateAccountFormValues } from '@/modules/auth/schemas/activate-account.schema';
import { completePasswordReset } from '@/modules/auth/api/auth.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { paths } from '@/routes/paths';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { logout } = useAuth();
  const [complete, setComplete] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ActivateAccountFormValues>({
    resolver: zodResolver(activateAccountSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ password }: ActivateAccountFormValues) => {
    setRequestError(null);
    try {
      await completePasswordReset({ token, password });
      logout();
      setComplete(true);
    } catch (error) {
      setRequestError(getApiErrorMessage(error));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
        {!token ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">El enlace no contiene un token válido. Solicita uno nuevo.</p>
        ) : complete ? (
          <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">Tu contraseña se actualizó. Ya puedes iniciar sesión.</p>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Nueva contraseña</label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="pr-12" error={errors.password?.message} {...register('password')} />
                <button
                  type="button"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  aria-label={showPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                  aria-controls="password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">Confirmar contraseña</label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" className="pr-12" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
                <button
                  type="button"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  aria-label={showConfirmation ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                  aria-controls="confirmPassword"
                  aria-pressed={showConfirmation}
                  onClick={() => setShowConfirmation((visible) => !visible)}
                >
                  {showConfirmation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {requestError && <p role="alert" className="text-sm text-red-700">{requestError}</p>}
            <Button type="submit" className="w-full" isLoading={isSubmitting}>Guardar contraseña</Button>
          </form>
        )}
        <Link to={token ? paths.login : paths.requestPasswordReset} className="mt-6 block text-center text-sm font-semibold text-blue-700 hover:underline">
          {token ? 'Volver a iniciar sesión' : 'Solicitar otro enlace'}
        </Link>
      </section>
    </main>
  );
}
