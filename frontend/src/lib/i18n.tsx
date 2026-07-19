import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

// Lightweight, dependency-free i18n. English is the source language and the
// fallback for any missing key. Add a language by extending `Lang`, `LANGUAGES`,
// and the `translations` table below.

export type Lang = 'en' | 'de' | 'es';

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
];

const STORAGE_KEY = 'mathom-lang';

type Vars = Record<string, string | number>;

// Each key maps to a string per language. `*_one` / `*_other` variants are
// selected automatically when a `count` variable is passed to `t`.
const translations: Record<Lang, Record<string, string>> = {
  en: {
    'app.tagline': 'Your Local AI Memory House',
    'language.label': 'Language',

    'nav.library': 'Library',
    'nav.collections': 'Collections',
    'nav.timeline': 'Timeline',
    'nav.templates': 'Templates',

    'library.title': 'The Mathom-house',
    'library.newMathom': '+ New Mathom',
    'library.searchPlaceholder': 'Search transcripts, summaries, titles…',
    'library.shelf.all': 'All',
    'library.shelf.favorites': '★ Favorites',
    'library.shelf.archived': 'Archived',
    'library.results_one': '{count} result for “{query}”',
    'library.results_other': '{count} results for “{query}”',
    'library.emptyTitle': 'The shelves are empty — for now.',
    'library.emptyBody': 'Upload your first recording and Mathom will remember it for you.',

    'detail.notFound': 'This Mathom is not on the shelves.',
    'detail.backToLibrary': 'Back to the Library',
    'detail.fetching': 'Fetching from the shelves…',
    'detail.library': '← Library',
    'detail.favorited': '★ Favorited',
    'detail.favorite': '☆ Favorite',
    'detail.toggleFavorite': 'Toggle favorite',
    'detail.unarchive': 'Unarchive',
    'detail.archive': 'Archive',
    'detail.delete': 'Delete',
    'detail.confirmDelete': 'Remove this Mathom and its audio for good?',
    'detail.errorFallback': 'Something went wrong while processing this recording.',
    'detail.tagsCollections': 'Tags & Collections',
    'detail.export': 'export .{format}',
    'detail.removeTag': 'Remove tag',
    'detail.addTag': 'add tag ⏎',
    'detail.noCollections': 'No collections yet — create one on the Collections page.',
    'detail.summaries': 'Summaries',
    'detail.thinking': 'Thinking…',
    'detail.generate': 'Generate',
    'detail.noSummaries': 'No summaries yet.',
    'detail.transcript': 'Transcript',
    'detail.transcriptPending': 'The transcript will appear here once processing finishes.',
    'detail.askTitle': 'Ask about this recording',
    'detail.clearConversation': 'Clear conversation',
    'detail.chatReady': 'e.g. What did we agree on?',
    'detail.chatWaiting': 'Available once the transcript is ready',
    'detail.ask': 'Ask',

    'collections.title': 'Collections',
    'collections.subtitle': 'Shelves for related recordings.',
    'collections.name': 'Name',
    'collections.namePlaceholder': 'e.g. House renovation',
    'collections.description': 'Description',
    'collections.create': 'Create',
    'collections.createError': 'Could not create collection',
    'collections.confirmDelete': 'Delete collection “{name}”? Mathoms stay in the library.',
    'collections.delete': 'Delete',
    'collections.empty': 'Empty — add Mathoms from their detail page.',

    'templates.title': 'Prompt Templates',
    'templates.new': '+ New template',
    'templates.helpBefore': 'Templates shape how Mathom writes summaries. Use ',
    'templates.helpAfter': ' where the transcript should go.',
    'templates.builtin': 'built-in',
    'templates.slug': 'Slug',
    'templates.slugPlaceholder': 'my-template',
    'templates.name': 'Name',
    'templates.description': 'Description',
    'templates.prompt': 'Prompt',
    'templates.created': 'Template created.',
    'templates.saved': 'Saved.',
    'templates.saveFailed': 'Saving failed',
    'templates.confirmDelete': 'Delete template “{name}”?',
    'templates.delete': 'Delete',
    'templates.create': 'Create',
    'templates.save': 'Save',

    'timeline.title': 'Timeline',
    'timeline.subtitle': 'Your memory house, month by month.',
    'timeline.empty': 'Nothing recorded yet.',

    'upload.title': 'Bring a recording home',
    'upload.subtitle':
      'It will be transcribed and summarized, then shelved in your Mathom-house.',
    'upload.audioFile': 'Audio file',
    'upload.chooseFileFirst': 'Choose an audio file first.',
    'upload.titleLabel': 'Title',
    'upload.optional': '(optional)',
    'upload.titlePlaceholder': 'e.g. Call with the roofing company',
    'upload.summaryStyle': 'Summary style',
    'upload.uploadFailed': 'Upload failed',
    'upload.cancel': 'Cancel',
    'upload.uploading': 'Uploading…',
    'upload.upload': 'Upload',
    'upload.sharedSubtitle':
      'Shared from another app. It will be transcribed and summarized, then shelved.',

    'share.receiving': 'Receiving your recording…',
    'share.emptyTitle': 'Nothing was shared.',
    'share.emptyBody': 'Share an audio message to Mathom to bring it home.',
    'share.backToLibrary': 'Back to the Library',

    'status.pending': 'Waiting',
    'status.transcribing': 'Transcribing…',
    'status.summarizing': 'Summarizing…',
    'status.ready': 'Ready',
    'status.error': 'Error',

    'card.favorite': 'favorite',
  },
  de: {
    'app.tagline': 'Dein lokales KI-Gedächtnishaus',
    'language.label': 'Sprache',

    'nav.library': 'Bibliothek',
    'nav.collections': 'Sammlungen',
    'nav.timeline': 'Zeitleiste',
    'nav.templates': 'Vorlagen',

    'library.title': 'Das Mathom-Haus',
    'library.newMathom': '+ Neues Mathom',
    'library.searchPlaceholder': 'Transkripte, Zusammenfassungen, Titel durchsuchen…',
    'library.shelf.all': 'Alle',
    'library.shelf.favorites': '★ Favoriten',
    'library.shelf.archived': 'Archiviert',
    'library.results_one': '{count} Ergebnis für „{query}“',
    'library.results_other': '{count} Ergebnisse für „{query}“',
    'library.emptyTitle': 'Die Regale sind leer — noch.',
    'library.emptyBody': 'Lade deine erste Aufnahme hoch und Mathom bewahrt sie für dich auf.',

    'detail.notFound': 'Dieses Mathom steht nicht im Regal.',
    'detail.backToLibrary': 'Zurück zur Bibliothek',
    'detail.fetching': 'Wird aus dem Regal geholt…',
    'detail.library': '← Bibliothek',
    'detail.favorited': '★ Favorisiert',
    'detail.favorite': '☆ Favorit',
    'detail.toggleFavorite': 'Favorit umschalten',
    'detail.unarchive': 'Aus Archiv holen',
    'detail.archive': 'Archivieren',
    'detail.delete': 'Löschen',
    'detail.confirmDelete': 'Dieses Mathom und seine Audiodatei endgültig entfernen?',
    'detail.errorFallback': 'Beim Verarbeiten dieser Aufnahme ist etwas schiefgelaufen.',
    'detail.tagsCollections': 'Schlagwörter & Sammlungen',
    'detail.export': 'als .{format} exportieren',
    'detail.removeTag': 'Schlagwort entfernen',
    'detail.addTag': 'Schlagwort hinzufügen ⏎',
    'detail.noCollections': 'Noch keine Sammlungen — lege eine auf der Sammlungen-Seite an.',
    'detail.summaries': 'Zusammenfassungen',
    'detail.thinking': 'Denkt nach…',
    'detail.generate': 'Erstellen',
    'detail.noSummaries': 'Noch keine Zusammenfassungen.',
    'detail.transcript': 'Transkript',
    'detail.transcriptPending': 'Das Transkript erscheint hier, sobald die Verarbeitung fertig ist.',
    'detail.askTitle': 'Frage zu dieser Aufnahme stellen',
    'detail.clearConversation': 'Unterhaltung löschen',
    'detail.chatReady': 'z. B. Worauf haben wir uns geeinigt?',
    'detail.chatWaiting': 'Verfügbar, sobald das Transkript bereit ist',
    'detail.ask': 'Fragen',

    'collections.title': 'Sammlungen',
    'collections.subtitle': 'Regale für zusammengehörige Aufnahmen.',
    'collections.name': 'Name',
    'collections.namePlaceholder': 'z. B. Hausrenovierung',
    'collections.description': 'Beschreibung',
    'collections.create': 'Anlegen',
    'collections.createError': 'Sammlung konnte nicht angelegt werden',
    'collections.confirmDelete':
      'Sammlung „{name}“ löschen? Die Mathoms bleiben in der Bibliothek.',
    'collections.delete': 'Löschen',
    'collections.empty': 'Leer — füge Mathoms über ihre Detailseite hinzu.',

    'templates.title': 'Prompt-Vorlagen',
    'templates.new': '+ Neue Vorlage',
    'templates.helpBefore':
      'Vorlagen bestimmen, wie Mathom Zusammenfassungen schreibt. Verwende ',
    'templates.helpAfter': ', wo das Transkript stehen soll.',
    'templates.builtin': 'integriert',
    'templates.slug': 'Kennung',
    'templates.slugPlaceholder': 'meine-vorlage',
    'templates.name': 'Name',
    'templates.description': 'Beschreibung',
    'templates.prompt': 'Prompt',
    'templates.created': 'Vorlage erstellt.',
    'templates.saved': 'Gespeichert.',
    'templates.saveFailed': 'Speichern fehlgeschlagen',
    'templates.confirmDelete': 'Vorlage „{name}“ löschen?',
    'templates.delete': 'Löschen',
    'templates.create': 'Anlegen',
    'templates.save': 'Speichern',

    'timeline.title': 'Zeitleiste',
    'timeline.subtitle': 'Dein Gedächtnishaus, Monat für Monat.',
    'timeline.empty': 'Noch nichts aufgenommen.',

    'upload.title': 'Eine Aufnahme nach Hause bringen',
    'upload.subtitle':
      'Sie wird transkribiert und zusammengefasst, dann in deinem Mathom-Haus einsortiert.',
    'upload.audioFile': 'Audiodatei',
    'upload.chooseFileFirst': 'Wähle zuerst eine Audiodatei aus.',
    'upload.titleLabel': 'Titel',
    'upload.optional': '(optional)',
    'upload.titlePlaceholder': 'z. B. Anruf mit der Dachdeckerfirma',
    'upload.summaryStyle': 'Zusammenfassungsstil',
    'upload.uploadFailed': 'Hochladen fehlgeschlagen',
    'upload.cancel': 'Abbrechen',
    'upload.uploading': 'Wird hochgeladen…',
    'upload.upload': 'Hochladen',
    'upload.sharedSubtitle':
      'Aus einer anderen App geteilt. Wird transkribiert, zusammengefasst und abgelegt.',

    'share.receiving': 'Deine Aufnahme wird empfangen…',
    'share.emptyTitle': 'Es wurde nichts geteilt.',
    'share.emptyBody': 'Teile eine Audionachricht an Mathom, um sie nach Hause zu bringen.',
    'share.backToLibrary': 'Zurück zur Bibliothek',

    'status.pending': 'Wartet',
    'status.transcribing': 'Transkribiert…',
    'status.summarizing': 'Fasst zusammen…',
    'status.ready': 'Fertig',
    'status.error': 'Fehler',

    'card.favorite': 'Favorit',
  },
  es: {
    'app.tagline': 'Tu casa de memoria con IA local',
    'language.label': 'Idioma',

    'nav.library': 'Biblioteca',
    'nav.collections': 'Colecciones',
    'nav.timeline': 'Cronología',
    'nav.templates': 'Plantillas',

    'library.title': 'La casa Mathom',
    'library.newMathom': '+ Nuevo Mathom',
    'library.searchPlaceholder': 'Buscar transcripciones, resúmenes, títulos…',
    'library.shelf.all': 'Todos',
    'library.shelf.favorites': '★ Favoritos',
    'library.shelf.archived': 'Archivados',
    'library.results_one': '{count} resultado para «{query}»',
    'library.results_other': '{count} resultados para «{query}»',
    'library.emptyTitle': 'Los estantes están vacíos — por ahora.',
    'library.emptyBody': 'Sube tu primera grabación y Mathom la recordará por ti.',

    'detail.notFound': 'Este Mathom no está en los estantes.',
    'detail.backToLibrary': 'Volver a la Biblioteca',
    'detail.fetching': 'Sacándolo de los estantes…',
    'detail.library': '← Biblioteca',
    'detail.favorited': '★ Favorito',
    'detail.favorite': '☆ Favorito',
    'detail.toggleFavorite': 'Alternar favorito',
    'detail.unarchive': 'Desarchivar',
    'detail.archive': 'Archivar',
    'detail.delete': 'Eliminar',
    'detail.confirmDelete': '¿Eliminar este Mathom y su audio para siempre?',
    'detail.errorFallback': 'Algo salió mal al procesar esta grabación.',
    'detail.tagsCollections': 'Etiquetas y colecciones',
    'detail.export': 'exportar .{format}',
    'detail.removeTag': 'Quitar etiqueta',
    'detail.addTag': 'añadir etiqueta ⏎',
    'detail.noCollections': 'Aún no hay colecciones — crea una en la página de Colecciones.',
    'detail.summaries': 'Resúmenes',
    'detail.thinking': 'Pensando…',
    'detail.generate': 'Generar',
    'detail.noSummaries': 'Aún no hay resúmenes.',
    'detail.transcript': 'Transcripción',
    'detail.transcriptPending': 'La transcripción aparecerá aquí cuando termine el procesamiento.',
    'detail.askTitle': 'Pregunta sobre esta grabación',
    'detail.clearConversation': 'Borrar conversación',
    'detail.chatReady': 'p. ej. ¿En qué quedamos?',
    'detail.chatWaiting': 'Disponible cuando la transcripción esté lista',
    'detail.ask': 'Preguntar',

    'collections.title': 'Colecciones',
    'collections.subtitle': 'Estantes para grabaciones relacionadas.',
    'collections.name': 'Nombre',
    'collections.namePlaceholder': 'p. ej. Reforma de la casa',
    'collections.description': 'Descripción',
    'collections.create': 'Crear',
    'collections.createError': 'No se pudo crear la colección',
    'collections.confirmDelete':
      '¿Eliminar la colección «{name}»? Los Mathoms permanecen en la biblioteca.',
    'collections.delete': 'Eliminar',
    'collections.empty': 'Vacía — añade Mathoms desde su página de detalle.',

    'templates.title': 'Plantillas de prompt',
    'templates.new': '+ Nueva plantilla',
    'templates.helpBefore': 'Las plantillas definen cómo Mathom escribe los resúmenes. Usa ',
    'templates.helpAfter': ' donde deba ir la transcripción.',
    'templates.builtin': 'integrada',
    'templates.slug': 'Identificador',
    'templates.slugPlaceholder': 'mi-plantilla',
    'templates.name': 'Nombre',
    'templates.description': 'Descripción',
    'templates.prompt': 'Prompt',
    'templates.created': 'Plantilla creada.',
    'templates.saved': 'Guardado.',
    'templates.saveFailed': 'Error al guardar',
    'templates.confirmDelete': '¿Eliminar la plantilla «{name}»?',
    'templates.delete': 'Eliminar',
    'templates.create': 'Crear',
    'templates.save': 'Guardar',

    'timeline.title': 'Cronología',
    'timeline.subtitle': 'Tu casa de memoria, mes a mes.',
    'timeline.empty': 'Aún no hay nada grabado.',

    'upload.title': 'Trae una grabación a casa',
    'upload.subtitle':
      'Se transcribirá y resumirá, y luego se guardará en tu casa Mathom.',
    'upload.audioFile': 'Archivo de audio',
    'upload.chooseFileFirst': 'Elige primero un archivo de audio.',
    'upload.titleLabel': 'Título',
    'upload.optional': '(opcional)',
    'upload.titlePlaceholder': 'p. ej. Llamada con la empresa de tejados',
    'upload.summaryStyle': 'Estilo de resumen',
    'upload.uploadFailed': 'Error al subir',
    'upload.cancel': 'Cancelar',
    'upload.uploading': 'Subiendo…',
    'upload.upload': 'Subir',
    'upload.sharedSubtitle':
      'Compartido desde otra app. Se transcribirá, se resumirá y se guardará.',

    'share.receiving': 'Recibiendo tu grabación…',
    'share.emptyTitle': 'No se compartió nada.',
    'share.emptyBody': 'Comparte un mensaje de audio con Mathom para traerlo a casa.',
    'share.backToLibrary': 'Volver a la Biblioteca',

    'status.pending': 'En espera',
    'status.transcribing': 'Transcribiendo…',
    'status.summarizing': 'Resumiendo…',
    'status.ready': 'Listo',
    'status.error': 'Error',

    'card.favorite': 'favorito',
  },
};

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function translate(lang: Lang, key: string, vars?: Vars): string {
  const table = translations[lang];
  const fallback = translations.en;

  let lookupKey = key;
  if (vars && 'count' in vars) {
    const plural = Number(vars.count) === 1 ? `${key}_one` : `${key}_other`;
    if (plural in table || plural in fallback) lookupKey = plural;
  }

  const template = table[lookupKey] ?? fallback[lookupKey] ?? key;
  return interpolate(template, vars);
}

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'de' || stored === 'es') return stored;
  const browser = window.navigator.language?.slice(0, 2).toLowerCase();
  if (browser === 'de' || browser === 'es') return browser;
  return 'en';
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  setLang: () => undefined,
  t: (key, vars) => translate('en', key, vars),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
