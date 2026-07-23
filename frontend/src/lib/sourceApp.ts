// Best-effort detection of the app a shared recording came from.
//
// Android's Web Share Target API does not tell the receiving app which app a
// file was shared from, so the identity is not available directly. Many
// messengers, however, name their exported media with a recognisable pattern
// (WhatsApp voice notes are `PTT-20260722-WA0004.opus`, and so on), which is a
// reliable enough signal to show a "Source" hint. Unknown patterns return null
// and the UI simply shows no badge.

interface Rule {
  label: string;
  test: RegExp;
}

const RULES: Rule[] = [
  // WhatsApp: PTT-/AUD-/VID-/IMG-<date>-WA####.<ext>, or a "WhatsApp …" name.
  { label: 'WhatsApp', test: /-WA\d+\.|^whatsapp[ _-]/i },
  // Telegram: voice_/audio_<date>_… exports, or a "Telegram …" name.
  { label: 'Telegram', test: /^(voice|audio)_\d{4}-\d{2}-\d{2}|telegram/i },
  // Signal: signal-<date>-… exports.
  { label: 'Signal', test: /^signal-\d{4}-\d{2}-\d{2}|^signal[ _-]/i },
];

/**
 * Return the human-readable name of the app a file most likely came from, or
 * null when the filename carries no recognisable signal. Brand names are
 * intentionally not translated.
 */
export function detectSourceApp(filename: string | null | undefined): string | null {
  if (!filename) return null;
  const name = filename.trim();
  for (const rule of RULES) {
    if (rule.test.test(name)) return rule.label;
  }
  return null;
}
