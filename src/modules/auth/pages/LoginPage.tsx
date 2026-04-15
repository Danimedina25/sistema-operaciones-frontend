import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

import { loginSchema, type LoginFormValues } from '@/modules/auth/schemas/login.schema';
import { useLogin } from '@/modules/auth/hooks/use-login';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

export default function LoginPage() {
  const { submitLogin, isSubmitting } = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correo: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: LoginFormValues) => {
    await submitLogin(values);

    // Aquí luego puedes guardar rememberMe si lo necesitas:
    // localStorage.setItem('rememberMe', JSON.stringify(rememberMe));
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden flex-1 items-center justify-center bg-slate-900 px-10 lg:flex">
        <div className="max-w-lg text-white">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-bold leading-tight">
            Sistema de operaciones financieras
          </h1>

          <p className="mt-4 text-base text-slate-300">
            Accede al panel administrativo para gestionar usuarios, cuentas bancarias
            y los procesos operativos del sistema.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa tus credenciales para continuar.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="correo" className="mb-2 block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <Input
                id="correo"
                type="email"
                placeholder="admin@sistema.com"
                autoComplete="email"
                error={errors.correo?.message}
                {...register('correo')}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Contraseña
              </label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  className="pr-12"
                  {...register('password')}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition duration-200 hover:scale-110 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="transition-all duration-200">
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                Recordarme
              </label>

              <a
                href="/forgot-password"
                className="text-sm font-medium text-slate-700 transition hover:text-slate-900 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Entrar al sistema
            </Button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
            Usa el correo y contraseña asignados a tu cuenta activa.
          </div>
        </div>
      </div>
    </div>
  );
}