import { useI18n } from '../lib/i18n';
import type { MathomStatus } from '../lib/types';

const STYLES: Record<MathomStatus, string> = {
  pending: 'bg-parchment-200 text-ink-700',
  transcribing: 'bg-hearth-100 text-hearth-600',
  summarizing: 'bg-hearth-100 text-hearth-600',
  ready: 'bg-moss-200 text-moss-700',
  error: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }: { status: MathomStatus }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}
