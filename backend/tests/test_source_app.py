"""Filename-based detection of a recording's origin app."""

from app.services.source_app import detect_source_app


def test_detects_whatsapp_voice_notes() -> None:
    assert detect_source_app("PTT-20260722-WA0004.opus") == "WhatsApp"
    assert detect_source_app("AUD-20240101-WA0012.m4a") == "WhatsApp"
    assert detect_source_app("WhatsApp Audio 2024-01-01 at 12.00.00.mp3") == "WhatsApp"


def test_detects_telegram_and_signal() -> None:
    assert detect_source_app("voice_2024-01-01_12-00-00.ogg") == "Telegram"
    assert detect_source_app("signal-2024-01-01-120000.aac") == "Signal"


def test_returns_none_for_unrecognised_or_empty() -> None:
    assert detect_source_app("meeting-notes.mp3") is None
    assert detect_source_app("") is None
    assert detect_source_app(None) is None
