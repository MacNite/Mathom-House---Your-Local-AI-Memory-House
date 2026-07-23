import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { I18nProvider } from '../lib/i18n';
import { ToastProvider } from '../lib/toast';
import type { MathomListItem } from '../lib/types';
import Library from './Library';

const { api } = vi.hoisted(() => ({
  api: {
    listMathoms: vi.fn(),
    listTags: vi.fn(),
    listSources: vi.fn(),
    search: vi.fn(),
    deleteMathom: vi.fn(),
  },
}));

vi.mock('../lib/api', () => ({ api }));

const recording: MathomListItem = {
  id: 1,
  title: 'Voice note from Max',
  status: 'ready',
  duration_seconds: 30,
  language: 'de',
  source_app: 'WhatsApp',
  favorite: false,
  archived: false,
  created_at: '2026-07-01T10:00:00Z',
  tags: [],
};

function renderLibrary() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <ToastProvider>
          <Library />
        </ToastProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('Library source filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listMathoms.mockResolvedValue([recording]);
    api.listTags.mockResolvedValue([]);
    api.listSources.mockResolvedValue(['Signal', 'WhatsApp']);
  });

  it('offers a chip per available source and filters by the one clicked', async () => {
    renderLibrary();

    // A chip appears for each distinct source app the archive contains.
    const whatsapp = await screen.findByRole('button', { name: 'WhatsApp' });
    await screen.findByRole('button', { name: 'Signal' });

    fireEvent.click(whatsapp);

    await waitFor(() =>
      expect(api.listMathoms).toHaveBeenLastCalledWith(
        expect.objectContaining({ sourceApp: 'WhatsApp' }),
      ),
    );
    expect(whatsapp).toHaveAttribute('aria-pressed', 'true');
  });
});
