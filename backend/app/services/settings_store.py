"""Owner-editable Authentik/OIDC settings.

Connection details are seeded from environment variables on first use and then
kept in the ``app_settings`` table so the Owner can adjust them in the UI
without touching the container. The database copy, once written, is
authoritative; unset keys fall back to the environment defaults.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AppSetting

_PREFIX = "authentik."
_STR_KEYS = ("issuer", "client_id", "client_secret", "scopes", "public_base_url")
_BOOL_KEYS = ("auto_create_users", "verify_ssl")


@dataclass
class AuthentikConfig:
    issuer: str
    client_id: str
    client_secret: str
    scopes: str
    public_base_url: str
    auto_create_users: bool
    verify_ssl: bool

    @property
    def configured(self) -> bool:
        """True once enough is set to attempt an OIDC login."""
        return bool(self.issuer and self.client_id and self.client_secret)


def _read(session: Session) -> dict[str, str]:
    rows = session.execute(
        select(AppSetting.key, AppSetting.value).where(AppSetting.key.like(f"{_PREFIX}%"))
    ).all()
    return {key[len(_PREFIX) :]: value for key, value in rows}


def get_authentik_config(session: Session) -> AuthentikConfig:
    settings = get_settings()
    stored = _read(session)

    def s(key: str, default: str) -> str:
        return stored.get(key, default)

    def b(key: str, default: bool) -> bool:
        if key in stored:
            return stored[key] == "true"
        return default

    return AuthentikConfig(
        issuer=s("issuer", settings.authentik_issuer).rstrip("/"),
        client_id=s("client_id", settings.authentik_client_id),
        client_secret=s("client_secret", settings.authentik_client_secret),
        scopes=s("scopes", settings.authentik_scopes),
        public_base_url=s("public_base_url", settings.public_base_url).rstrip("/"),
        auto_create_users=b("auto_create_users", settings.auth_auto_create_users),
        verify_ssl=b("verify_ssl", settings.oidc_verify_ssl),
    )


def _set(session: Session, key: str, value: str) -> None:
    full = f"{_PREFIX}{key}"
    setting = session.get(AppSetting, full)
    if setting is None:
        session.add(AppSetting(key=full, value=value))
    else:
        setting.value = value


def update_authentik_config(session: Session, updates: dict[str, object]) -> AuthentikConfig:
    """Persist a partial update. ``client_secret`` is only written when a
    non-empty value is provided, so the UI can leave it blank to keep it."""
    for key in _STR_KEYS:
        if key in updates and updates[key] is not None:
            value = str(updates[key]).strip()
            if key == "client_secret" and value == "":
                continue
            _set(session, key, value)
    for key in _BOOL_KEYS:
        if key in updates and updates[key] is not None:
            _set(session, key, "true" if updates[key] else "false")
    session.commit()
    return get_authentik_config(session)
