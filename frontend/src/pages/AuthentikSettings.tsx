import { useEffect, useState } from 'react';

import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import type { AuthentikSettings as Settings } from '../lib/types';

export default function AuthentikSettings() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [issuer, setIssuer] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [scopes, setScopes] = useState('');
  const [publicBaseUrl, setPublicBaseUrl] = useState('');
  const [autoCreate, setAutoCreate] = useState(true);
  const [verifySsl, setVerifySsl] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const apply = (data: Settings) => {
    setSettings(data);
    setIssuer(data.issuer);
    setClientId(data.client_id);
    setScopes(data.scopes);
    setPublicBaseUrl(data.public_base_url);
    setAutoCreate(data.auto_create_users);
    setVerifySsl(data.verify_ssl);
    setClientSecret('');
  };

  useEffect(() => {
    void api.getAuthentikSettings().then(apply);
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await api.updateAuthentikSettings({
        issuer,
        client_id: clientId,
        client_secret: clientSecret, // blank keeps the stored secret
        scopes,
        public_base_url: publicBaseUrl,
        auto_create_users: autoCreate,
        verify_ssl: verifySsl,
      });
      apply(updated);
      setMessage(t('settings.saved'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl text-ink-900">{t('settings.title')}</h2>
      <p className="mt-1 text-sm text-ink-500">{t('settings.subtitle')}</p>

      <p className="mt-3 text-sm">
        {t('settings.status')}:{' '}
        <span className={settings?.configured ? 'text-moss-700' : 'text-ink-400'}>
          {settings?.configured ? t('settings.configured') : t('settings.notConfigured')}
        </span>
      </p>

      <form onSubmit={save} className="card mt-4 space-y-4">
        <label className="block text-sm text-ink-700">
          {t('settings.issuer')}
          <input
            value={issuer}
            onChange={(event) => setIssuer(event.target.value)}
            placeholder={t('settings.issuerHint')}
            className="input mt-1"
          />
        </label>

        <label className="block text-sm text-ink-700">
          {t('settings.clientId')}
          <input
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className="input mt-1"
          />
        </label>

        <label className="block text-sm text-ink-700">
          {t('settings.clientSecret')}
          <input
            type="password"
            value={clientSecret}
            onChange={(event) => setClientSecret(event.target.value)}
            placeholder={settings?.client_secret_set ? '••••••••' : ''}
            className="input mt-1"
            autoComplete="new-password"
          />
          {settings?.client_secret_set && (
            <span className="mt-1 block text-xs text-ink-400">{t('settings.clientSecretSet')}</span>
          )}
        </label>

        <label className="block text-sm text-ink-700">
          {t('settings.scopes')}
          <input
            value={scopes}
            onChange={(event) => setScopes(event.target.value)}
            className="input mt-1"
          />
        </label>

        <label className="block text-sm text-ink-700">
          {t('settings.publicBaseUrl')}
          <input
            value={publicBaseUrl}
            onChange={(event) => setPublicBaseUrl(event.target.value)}
            placeholder={t('settings.publicBaseUrlHint')}
            className="input mt-1"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={autoCreate}
            onChange={(event) => setAutoCreate(event.target.checked)}
          />
          {t('settings.autoCreate')}
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={verifySsl}
            onChange={(event) => setVerifySsl(event.target.checked)}
          />
          {t('settings.verifySsl')}
        </label>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {t('settings.save')}
          </button>
          {message && <span className="text-sm text-moss-700">{message}</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>
      </form>
    </div>
  );
}
