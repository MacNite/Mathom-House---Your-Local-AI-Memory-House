import { describe, expect, it } from 'vitest';

import { detectSourceApp } from './sourceApp';

describe('detectSourceApp', () => {
  it('recognises WhatsApp voice notes', () => {
    expect(detectSourceApp('PTT-20260722-WA0004.opus')).toBe('WhatsApp');
    expect(detectSourceApp('AUD-20240101-WA0012.m4a')).toBe('WhatsApp');
    expect(detectSourceApp('WhatsApp Audio 2024-01-01 at 12.00.00.mp3')).toBe('WhatsApp');
  });

  it('recognises Telegram and Signal exports', () => {
    expect(detectSourceApp('voice_2024-01-01_12-00-00.ogg')).toBe('Telegram');
    expect(detectSourceApp('signal-2024-01-01-120000.aac')).toBe('Signal');
  });

  it('returns null for unrecognised or empty names', () => {
    expect(detectSourceApp('meeting-notes.mp3')).toBeNull();
    expect(detectSourceApp('')).toBeNull();
    expect(detectSourceApp(null)).toBeNull();
    expect(detectSourceApp(undefined)).toBeNull();
  });
});
