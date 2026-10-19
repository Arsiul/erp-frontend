import { LogIn } from 'lucide-react';
import { useMemo, useState, type SubmitEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLogin, useSession } from '@/hooks/useSession';
import { Brand } from '@/layouts/AppLayout/Brand';
import { inputClass } from '@/modules/shared/form-styles';
import { DEMO_PASSWORD, sessionService } from '@/services/session.service';

/** Ruta a la que volver tras iniciar sesión (solo rutas internas). */
function returnPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('/login')
    ? from
    : '/';
}

/** Acceso simulado: cualquier usuario activo con la contraseña de la demo. */
export function LoginPage() {
  const { session } = useSession();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const accounts = useMemo(() => sessionService.demoAccounts(), []);
  const [email, setEmail] = useState(() => accounts[0]?.email ?? '');
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
            <p className="text-sm text-ink-muted">Entorno de demostración con datos simulados.</p>
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

        <Card className="px-6 py-5">
          <p className="text-sm text-ink">
            Contraseña para todas las cuentas:{' '}
            <code className="font-semibold">{DEMO_PASSWORD}</code>
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Elige una cuenta para probar los permisos de cada rol.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {accounts.map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm hover:text-primary-700"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(DEMO_PASSWORD);
                  }}
                >
                  <span>
                    <span className="block font-medium text-ink">{account.name}</span>
                    <span className="block text-xs text-ink-subtle">{account.email}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-ink-muted">
                    {account.roleName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
