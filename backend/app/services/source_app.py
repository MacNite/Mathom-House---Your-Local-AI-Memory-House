"""Best-effort detection of the app a recording came from.

The platform never tells us which app shared a file, but many messengers name
their exported media recognisably (a WhatsApp voice note is
``PTT-20260722-WA0004.opus``). Detecting from the filename lets Mathom label and
filter recordings by origin. Unknown names return ``None`` and carry no origin.

The rules here mirror ``frontend/src/lib/sourceApp.ts`` so the badge shown at
upload time and the value stored on the server stay in agreement.
"""

import re

_RULES: tuple[tuple[str, re.Pattern[str]], ...] = (
    # WhatsApp: PTT-/AUD-/VID-/IMG-<date>-WA####.<ext>, or a "WhatsApp …" name.
    ("WhatsApp", re.compile(r"-WA\d+\.|^whatsapp[ _-]", re.IGNORECASE)),
    # Telegram: voice_/audio_<date>_… exports, or a "Telegram …" name.
    ("Telegram", re.compile(r"^(voice|audio)_\d{4}-\d{2}-\d{2}|telegram", re.IGNORECASE)),
    # Signal: signal-<date>-… exports.
    ("Signal", re.compile(r"^signal-\d{4}-\d{2}-\d{2}|^signal[ _-]", re.IGNORECASE)),
)


def detect_source_app(filename: str | None) -> str | None:
    """Return the app a file most likely came from, or ``None`` when the
    filename carries no recognisable signal. Brand names are not translated."""
    if not filename:
        return None
    name = filename.strip()
    for label, pattern in _RULES:
        if pattern.search(name):
            return label
    return None
