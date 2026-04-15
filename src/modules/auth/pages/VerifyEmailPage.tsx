import { useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MailCheck, MailX, LoaderCircle } from 'lucide-react';
import { paths } from '@/routes/paths';
import { useCompleteEmailVerification } from '@/modules/auth/hooks/use-complete-email-verification';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { verifyEmail, isLoading, isSuccess, errorMessage } =
    useCompleteEmailVerification();

  const hasToken = useMemo(() => token.trim().length > 0, [token]);

  useEffect(() => {
    if (!hasToken) return;
    void verifyEmail(token);
  }, [hasToken, token, verifyEmail]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden flex-1 items-center justify-center bg-slate-900 px-10 lg:flex">
        <div className="max-w-lg text-white">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            {isSuccess ? (
              <MailCheck className="h-7 w-7" />
            ) : (
              <MailX className="h-7 w-7" />
            )}
          </div>

          <h1 className="text-4xl font-bold leading-tight">
            Verificación de correo
          </h1>

          <p className="mt-4 text-base text-slate-300">
            Estamos validando el nuevo correo electrónico asociado a tu cuenta en
            el sistema.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {!hasToken ? (
            <>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                <MailX className="h-6 w-6 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Enlace inválido
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                El enlace no contiene un token válido para verificar el correo.
              </p>
            </>
          ) : isLoading ? (
            <>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <LoaderCircle className="h-6 w-6 animate-spin text-slate-700" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Verificando correo
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Espera un momento mientras validamos tu nuevo correo electrónico.
              </p>
            </>
          ) : isSuccess ? (
            <>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                <MailCheck className="h-6 w-6 text-emerald-600" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Correo verificado
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Tu nuevo correo electrónico fue verificado correctamente.
              </p>

              <Link
                to={paths.login}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Ir a iniciar sesión
              </Link>
            </>
          ) : (
            <>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                <MailX className="h-6 w-6 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                No se pudo verificar
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {errorMessage ?? 'Ocurrió un error al verificar el correo.'}
              </p>

              <Link
                to={paths.login}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Volver al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}