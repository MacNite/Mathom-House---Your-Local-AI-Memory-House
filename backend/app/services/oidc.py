"""Authentik OIDC (OpenID Connect) client — authorization-code flow.

MFA/2FA is handled entirely by Authentik during the authorize step; Mathom
never sees a password or second factor. All network calls go through httpx
with explicit timeouts.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

import httpx

from app.services.settings_store import AuthentikConfig

_DISCOVERY_SUFFIX = "/.well-known/openid-configuration"
_TIMEOUT = httpx.Timeout(15.0, connect=10.0)

# Discovery documents are cached per issuer for the process lifetime.
_discovery_cache: dict[str, dict[str, Any]] = {}


class OIDCError(RuntimeError):
    """Raised when Authentik cannot be reached or returns an error."""


def _client(config: AuthentikConfig) -> httpx.Client:
    return httpx.Client(timeout=_TIMEOUT, verify=config.verify_ssl)


def discover(config: AuthentikConfig) -> dict[str, Any]:
    if not config.issuer:
        raise OIDCError("Authentik issuer is not configured")
    cached = _discovery_cache.get(config.issuer)
    if cached is not None:
        return cached
    url = f"{config.issuer}{_DISCOVERY_SUFFIX}"
    try:
        with _client(config) as client:
            response = client.get(url)
            response.raise_for_status()
            document = response.json()
    except httpx.HTTPError as exc:
        raise OIDCError(f"Could not reach Authentik discovery endpoint: {exc}") from exc
    _discovery_cache[config.issuer] = document
    return document


def clear_discovery_cache() -> None:
    """Drop cached discovery documents (call after settings change)."""
    _discovery_cache.clear()


def build_authorize_url(
    config: AuthentikConfig, *, state: str, nonce: str, redirect_uri: str
) -> str:
    document = discover(config)
    endpoint = document.get("authorization_endpoint")
    if not endpoint:
        raise OIDCError("Authentik discovery is missing authorization_endpoint")
    params = {
        "response_type": "code",
        "client_id": config.client_id,
        "redirect_uri": redirect_uri,
        "scope": config.scopes,
        "state": state,
        "nonce": nonce,
    }
    return f"{endpoint}?{urlencode(params)}"


def exchange_code(config: AuthentikConfig, *, code: str, redirect_uri: str) -> dict[str, Any]:
    document = discover(config)
    endpoint = document.get("token_endpoint")
    if not endpoint:
        raise OIDCError("Authentik discovery is missing token_endpoint")
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": config.client_id,
        "client_secret": config.client_secret,
    }
    try:
        with _client(config) as client:
            response = client.post(endpoint, data=data)
            response.raise_for_status()
            return dict(response.json())
    except httpx.HTTPError as exc:
        raise OIDCError(f"Token exchange with Authentik failed: {exc}") from exc


def fetch_userinfo(config: AuthentikConfig, *, access_token: str) -> dict[str, Any]:
    document = discover(config)
    endpoint = document.get("userinfo_endpoint")
    if not endpoint:
        raise OIDCError("Authentik discovery is missing userinfo_endpoint")
    try:
        with _client(config) as client:
            response = client.get(endpoint, headers={"Authorization": f"Bearer {access_token}"})
            response.raise_for_status()
            return dict(response.json())
    except httpx.HTTPError as exc:
        raise OIDCError(f"Fetching Authentik userinfo failed: {exc}") from exc
