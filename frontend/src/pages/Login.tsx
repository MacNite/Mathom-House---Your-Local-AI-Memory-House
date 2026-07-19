import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';

const KNOWN_ERRORS = new Set([
  'expired',
  'not_provisioned',
  'account_disabled',
]);

function errorKey(code: string | null): string | null {
  if (!code) return null;
  return KNOWN_ERRORS.has(code) ? `auth.error.${code}` : 'auth.error.generic';
}

export default function Login() {
  const { t } = useI18n();
  const { status, login } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const errKey = errorKey(params.get('auth_error'));

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-md text-center">
        <div className="mb-2 text-4xl" aria-hidden>
          🏡
        </div>
        <h1 className="font-display text-3xl text-hearth-600">Mathom</h1>
        <h2 className="mt-4 font-display text-xl text-ink-900">{t('auth.welcome')}</h2>
        <p className="mt-1 text-sm text-ink-500">{t('auth.subtitle')}</p>

        {errKey && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{t(errKey)}</p>
        )}

        {status.configured ? (
          <button onClick={login} className="btn-primary mt-6 w-full">
            {t('auth.signIn')}
          </button>
        ) : (
          <p className="mt-6 rounded-xl bg-parchment-100 px-3 py-2 text-sm text-ink-500">
            {t('auth.notConfigured')}
          </p>
        )}
      </div>
    </div>
  );
}
