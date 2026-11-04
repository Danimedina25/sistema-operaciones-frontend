import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { requestPasswordReset } from '@/modules/auth/api/auth.api';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { paths } from '@/routes/paths';

const schema = z.object({
  correo: z.email('Ingresa un correo válido'),
});
type FormValues = z.infer<typeof schema>;

export default function RequestPasswordResetPage() {
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { correo: '' },
  });

  const onSubmit = async ({ correo }: FormValues) => {
    setRequestError(null);
    try {
      await requestPasswordReset({ correo: correo.trim().toLowerCase() });
      setSent(true);
    } catch (error) {
      setRequestError(getApiErrorMessage(error));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
        {sent ? (
          <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">
            Si el correo corresponde a una cuenta habilitada, recibirás un enlace para restablecer tu contraseña.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">Ingresa el correo de tu cuenta y te enviaremos las instrucciones.</p>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="correo" className="mb-2 block text-sm font-medium text-slate-700">Correo electrónico</label>
                <Input id="correo" type="email" autoComplete="email" error={errors.correo?.message} {...register('correo')} />
              </div>
              {requestError && <p role="alert" className="text-sm text-red-700">{requestError}</p>}
              <Button type="submit" className="w-full" isLoading={isSubmitting}>Enviar enlace</Button>
            </form>
          </>
        )}
        <Link to={paths.login} className="mt-6 block text-center text-sm font-semibold text-blue-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}
