import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import UploadDialog from '../components/UploadDialog';
import { useI18n } from '../lib/i18n';
import { clearSharedAudio, readSharedAudio } from '../lib/pwa';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; file: File; title: string }
  | { kind: 'empty' };

// Landing page for the Android Share Sheet. The service worker has already
// stashed the shared audio file in Cache Storage and redirected here; we read
// it back and open the upload dialog pre-filled with it.
export default function ShareTarget() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    readSharedAudio().then((shared) => {
      if (cancelled) return;
      if (shared) {
        setState({ kind: 'ready', file: shared.file, title: shared.title });
      } else {
        setState({ kind: 'empty' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = () => {
    void clearSharedAudio();
    navigate('/', { replace: true });
  };

  if (state.kind === 'loading') {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="font-display text-lg text-ink-700">{t('share.receiving')}</p>
      </div>
    );
  }

  if (state.kind === 'empty') {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="font-display text-lg text-ink-700">{t('share.emptyTitle')}</p>
        <p className="mt-1 text-sm text-ink-500">{t('share.emptyBody')}</p>
        <button onClick={() => navigate('/', { replace: true })} className="btn-primary mt-4">
          {t('share.backToLibrary')}
        </button>
      </div>
    );
  }

  return (
    <UploadDialog
      open
      sharedFile={state.file}
      sharedTitle={state.title}
      onClose={finish}
      onUploaded={finish}
    />
  );
}
