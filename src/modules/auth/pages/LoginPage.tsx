import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LockKeyhole, ShieldCheck, Building2 } from 'lucide-react';

import { loginSchema, type LoginFormValues } from '@/modules/auth/schemas/login.schema';
import { useLogin } from '@/modules/auth/hooks/use-login';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import logo from '@/assets/logo.png';

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
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.4),transparent_40%)]" />

      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden items-center justify-center px-12 lg:flex">
          <div className="max-w-xl">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
                <img
                  src={logo}
                  alt="SE Estatus"
                  className="h-full w-full object-contain drop-shadow-lg"
                />
              </div>

              <div>
                <p className="text-sm font-medium tracking-[0.35em] text-blue-200">
                  Centro de operaciones
                </p>
                <h1 className="mt-1 text-2xl font-bold text-white">
                  SE Estatus
                </h1>
              </div>
            </div>

            <h2 className="text-5xl font-bold leading-tight tracking-tight text-white">
              Centraliza procesos, operaciones y control administrativo en un solo sistema.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Accede al panel administrativo para gestionar usuarios, cuentas bancarias
              y procesos operativos desde una plataforma diseñada para trabajar con orden,
              visibilidad y confianza.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <ShieldCheck className="mb-4 h-6 w-6 text-blue-200" />
                <p className="text-sm font-semibold text-white">Acceso protegido</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Inicio de sesión seguro para usuarios autorizados.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <Building2 className="mb-4 h-6 w-6 text-blue-200" />
                <p className="text-sm font-semibold text-white">Gestión centralizada</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Operaciones, cuentas y usuarios en un solo lugar.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
                <img
                  src={logo}
                  alt="SE Estatus"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/95 p-7 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                  <LockKeyhole className="h-5 w-5" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Bienvenido
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Ingresa tus credenciales para acceder al panel administrativo.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label
                    htmlFor="correo"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Correo electrónico
                  </label>

                  <Input
                    id="correo"
                    type="email"
                    placeholder="admin@sistema.com"
                    autoComplete="email"
                    error={errors.correo?.message}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 transition focus:bg-white"
                    {...register('correo')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Contraseña
                  </label>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      error={errors.password?.message}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50 pr-12 transition focus:bg-white"
                      {...register('password')}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center text-slate-400 transition hover:scale-110 hover:text-slate-700"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    Recordarme
                  </label>

                  <a
                    href="/forgot-password"
                    className="text-sm font-semibold text-slate-700 transition hover:text-blue-700 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-slate-950 font-semibold shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800"
                  isLoading={isSubmitting}
                >
                  Entrar al sistema
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs leading-5 text-slate-500">
                Usa únicamente el correo y contraseña de tu cuenta activa.
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} SE Estatus. Acceso administrativo.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}