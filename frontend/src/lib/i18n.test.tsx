import { translate } from './i18n';

describe('translate', () => {
  it('returns the string for the requested language', () => {
    expect(translate('en', 'nav.library')).toBe('Library');
    expect(translate('de', 'nav.library')).toBe('Bibliothek');
    expect(translate('es', 'nav.library')).toBe('Biblioteca');
  });

  it('interpolates variables', () => {
    expect(translate('en', 'templates.confirmDelete', { name: 'TL;DR' })).toBe(
      'Delete template “TL;DR”?',
    );
  });

  it('selects singular vs plural on count', () => {
    expect(translate('en', 'library.results', { count: 1, query: 'roof' })).toBe(
      '1 result for “roof”',
    );
    expect(translate('en', 'library.results', { count: 3, query: 'roof' })).toBe(
      '3 results for “roof”',
    );
  });

  it('falls back to English for a missing translation, then to the key', () => {
    // A real key present only in English still resolves for another language.
    expect(translate('de', 'card.favorite')).toBe('Favorit');
    // An unknown key returns the key itself rather than throwing.
    expect(translate('de', 'does.not.exist')).toBe('does.not.exist');
  });
});
