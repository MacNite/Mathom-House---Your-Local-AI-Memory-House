"""OIDC nonce binding: the ID token's nonce must match the one we issued."""

import base64
import json
from urllib.parse import parse_qs, urlparse

import pytest

from app.services import oidc
from tests.conftest import AuthHarness


def _seg(data: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(data).encode()).rstrip(b"=").decode()


def _fake_id_token(nonce: str) -> str:
    return f"{_seg({'alg': 'none'})}.{_seg({'nonce': nonce})}.sig"


def test_id_token_nonce_parsing() -> None:
    assert oidc.id_token_nonce(_fake_id_token("abc")) == "abc"
    assert oidc.id_token_nonce("") is None
    assert oidc.id_token_nonce("not-a-jwt") is None
    assert oidc.id_token_nonce("only.two") is None


def _start_login(harness: AuthHarness, claims: dict) -> tuple[object, str, str]:
    client = harness.client()
    harness.claims.clear()
    harness.claims.update(claims)
    start = client.get("/api/auth/login", follow_redirects=False)
    query = parse_qs(urlparse(start.headers["location"]).query)
    return client, query["state"][0], query["nonce"][0]


def test_callback_rejects_mismatched_nonce(
    auth_harness: AuthHarness, monkeypatch: pytest.MonkeyPatch
) -> None:
    client, state, _nonce = _start_login(auth_harness, {"sub": "n1", "email": "n1@example.com"})
    monkeypatch.setattr(
        oidc,
        "exchange_code",
        lambda config, **kw: {"access_token": "t", "id_token": _fake_id_token("WRONG")},
    )
    done = client.get(f"/api/auth/callback?code=c&state={state}", follow_redirects=False)
    assert "auth_error=invalid_nonce" in done.headers["location"]


def test_callback_accepts_matching_nonce(
    auth_harness: AuthHarness, monkeypatch: pytest.MonkeyPatch
) -> None:
    client, state, nonce = _start_login(auth_harness, {"sub": "n2", "email": "n2@example.com"})
    monkeypatch.setattr(
        oidc,
        "exchange_code",
        lambda config, **kw: {"access_token": "t", "id_token": _fake_id_token(nonce)},
    )
    done = client.get(f"/api/auth/callback?code=c&state={state}", follow_redirects=False)
    assert "auth_error" not in done.headers["location"]
