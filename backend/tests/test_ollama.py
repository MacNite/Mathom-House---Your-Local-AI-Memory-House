"""Unit tests for the language-aware prompt handling in services/ollama.py.

These never touch the network: the HTTP client is stubbed so we only assert on
the payload that would be sent to Ollama.
"""

from typing import Any

import pytest

from app.services import ollama


class _FakeResponse:
    def __init__(self, content: str) -> None:
        self._content = content

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, Any]:
        return {"message": {"content": self._content}}


class _FakeClient:
    """Captures the payload posted to /api/chat instead of doing any I/O."""

    captured: dict[str, Any] = {}

    def __enter__(self) -> "_FakeClient":
        return self

    def __exit__(self, *exc: object) -> None:
        return None

    def post(self, url: str, json: dict[str, Any]) -> _FakeResponse:
        _FakeClient.captured = json
        return _FakeResponse("ok")


@pytest.fixture()
def fake_client(monkeypatch: pytest.MonkeyPatch) -> type[_FakeClient]:
    _FakeClient.captured = {}
    monkeypatch.setattr(ollama, "_client", lambda: _FakeClient())
    return _FakeClient


def test_language_directive_uses_human_readable_name() -> None:
    directive = ollama.language_directive("de")
    assert directive is not None
    assert "German" in directive


def test_language_directive_falls_back_to_raw_code() -> None:
    directive = ollama.language_directive("xx")
    assert directive is not None
    assert "xx" in directive


def test_language_directive_none_when_unknown() -> None:
    assert ollama.language_directive(None) is None
    assert ollama.language_directive("") is None
    assert ollama.language_directive("   ") is None


def test_chat_injects_language_directive(fake_client: type[_FakeClient]) -> None:
    ollama.chat([{"role": "user", "content": "hi"}], language="es")
    system = fake_client.captured["messages"][0]
    assert system["role"] == "system"
    assert "Spanish" in system["content"]


def test_chat_without_language_has_plain_system_prompt(
    fake_client: type[_FakeClient],
) -> None:
    ollama.chat([{"role": "user", "content": "hi"}])
    system = fake_client.captured["messages"][0]
    assert system["content"] == ollama.SYSTEM_PROMPT


def test_generate_summary_forwards_language(fake_client: type[_FakeClient]) -> None:
    ollama.generate_summary("a transcript", "Summarize {transcript}", language="de")
    system = fake_client.captured["messages"][0]
    assert "German" in system["content"]
