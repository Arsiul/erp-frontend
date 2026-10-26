import { Cloud, Eye, EyeOff, LogIn } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import { Button } from '@/components/ui/Button';
import { APP_INFO } from '@/config/app';
import { useLogin, useSession } from '@/hooks/useSession';
import { Brand } from '@/layouts/AppLayout/Brand';
import { inputClass } from '@/modules/shared/form-styles';

/** Ruta a la que volver tras iniciar sesión (solo rutas internas). */
function returnPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('/login')
    ? from
    : '/';
}

/** Panel de bienvenida: solo en escritorio. */
function WelcomePanel() {
  return (
    <section className="relative hidden overflow-hidden bg-linear-to-br from-primary-700 via-primary-800 to-primary-950 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-center">
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.07]"
      />
      <Cloud
        aria-hidden
        strokeWidth={1}
        className="absolute -bottom-16 -left-16 size-80 text-white/6"
      />
      <div className="relative max-w-sm">
        <p className="text-5xl font-light tracking-[0.12em]">BIENVENIDO</p>
        <p className="mt-2 flex items-center gap-3 text-2xl font-light">
          <span aria-hidden className="h-px w-24 bg-white/60" />a {APP_INFO.name}
        </p>
        <p className="mt-8 text-sm leading-relaxed text-primary-100">
          Gestiona ventas, compras, inventario y tesorería de tu empresa desde un solo lugar.
          Ingresa con tu cuenta para continuar.
        </p>
      </div>
    </section>
  );
}

/** Círculos decorativos de la esquina del formulario. */
function CornerBubbles() {
  return (
    <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 size-56">
      <span className="absolute top-0 left-6 size-28 rounded-full bg-primary-300/50" />
      <span className="absolute top-10 left-20 size-32 rounded-full bg-primary-500/40" />
      <span className="absolute top-2 left-28 size-24 rounded-full bg-primary-600/40" />
      <span className="absolute top-24 left-32 size-24 rounded-full bg-primary-400/40" />
    </div>
  );
}

/** Acceso con correo y contraseña. */
export function LoginPage() {
  const { session } = useSession();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const target = returnPath(location.state);

  if (session && !login.isPending) return <Navigate to={target} replace />;

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          void navigate(target, { replace: true });
        },
      },
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-popover lg:min-h-145 lg:grid-cols-2">
        <WelcomePanel />
        <section className="relative flex flex-col justify-center overflow-hidden px-6 py-12 sm:px-12">
          <CornerBubbles />
          <div className="relative mx-auto w-full max-w-sm">
            <div className="mb-8 flex justify-center lg:hidden">
              <Brand compact={false} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-medium tracking-wide text-ink">Iniciar sesión</h1>
              <p className="mt-2 text-sm text-ink-muted">
                Ingresa tu correo y contraseña para acceder al sistema.
              </p>
            </div>
            <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
              <label className="block">
                <span className="sr-only">Correo</span>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="Correo electrónico"
                  className={inputClass(false, 'h-11 shadow-card')}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                />
              </label>
              <div className="relative">
                <label className="block">
                  <span className="sr-only">Contraseña</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Contraseña"
                    className={inputClass(login.isError, 'h-11 pr-11 shadow-card')}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                    }}
                  />
                </label>
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-ink-subtle transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none"
                  onClick={() => {
                    setShowPassword((value) => !value);
                  }}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              {login.isError && (
                <p role="alert" className="text-sm text-rose-700">
                  {login.error.message}
                </p>
              )}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  className="h-11 w-full sm:w-3/4"
                  disabled={login.isPending || !email || !password}
                >
                  <LogIn className="size-4" aria-hidden />
                  {login.isPending ? 'Ingresando…' : 'Ingresar'}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
