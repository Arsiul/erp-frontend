import { LogIn } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

/** Acceso con correo y contraseña. */
export function LoginPage() {
  const { session } = useSession();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Brand compact={false} />
        </div>
        <Card className="space-y-5 px-6 py-6">
          <div>
            <h1 className="text-lg font-semibold text-ink">Iniciar sesión</h1>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              Correo
              <input
                type="email"
                autoComplete="username"
                className={inputClass(false, 'h-10')}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                className={inputClass(login.isError, 'h-10')}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
              />
            </label>
            {login.isError && (
              <p role="alert" className="text-sm text-rose-700">
                {login.error.message}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={login.isPending || !email || !password}
            >
              <LogIn className="size-4" aria-hidden />
              {login.isPending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
