"""Owner-configurable Authentik connection settings."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_admin
from app.models import User
from app.schemas import (
    AuthentikSettingsOut,
    AuthentikSettingsUpdate,
    SmtpSettingsOut,
    SmtpSettingsUpdate,
)
from app.services import oidc
from app.services.settings_store import (
    AuthentikConfig,
    SmtpConfig,
    get_authentik_config,
    get_smtp_config,
    update_authentik_config,
    update_smtp_config,
)

router = APIRouter(prefix="/settings", tags=["settings"])


def _to_out(config: AuthentikConfig) -> AuthentikSettingsOut:
    return AuthentikSettingsOut(
        issuer=config.issuer,
        client_id=config.client_id,
        scopes=config.scopes,
        public_base_url=config.public_base_url,
        auto_create_users=config.auto_create_users,
        verify_ssl=config.verify_ssl,
        configured=config.configured,
        client_secret_set=bool(config.client_secret),
    )


@router.get("/authentik", response_model=AuthentikSettingsOut)
def get_authentik(
    db: Session = Depends(get_db), _admin: User = Depends(require_admin)
) -> AuthentikSettingsOut:
    return _to_out(get_authentik_config(db))


@router.put("/authentik", response_model=AuthentikSettingsOut)
def put_authentik(
    payload: AuthentikSettingsUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> AuthentikSettingsOut:
    config = update_authentik_config(db, payload.model_dump(exclude_unset=True))
    # Discovery may now point at a different issuer; drop the cached document.
    oidc.clear_discovery_cache()
    return _to_out(config)


def _smtp_to_out(config: SmtpConfig) -> SmtpSettingsOut:
    return SmtpSettingsOut(
        host=config.host,
        port=config.port,
        username=config.username,
        from_email=config.from_email,
        from_name=config.from_name,
        public_base_url=config.public_base_url,
        use_tls=config.use_tls,
        invite_expiry_hours=config.invite_expiry_hours,
        configured=config.configured,
        password_set=bool(config.password),
    )


@router.get("/smtp", response_model=SmtpSettingsOut)
def get_smtp(
    db: Session = Depends(get_db), _admin: User = Depends(require_admin)
) -> SmtpSettingsOut:
    return _smtp_to_out(get_smtp_config(db))


@router.put("/smtp", response_model=SmtpSettingsOut)
def put_smtp(
    payload: SmtpSettingsUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> SmtpSettingsOut:
    return _smtp_to_out(update_smtp_config(db, payload.model_dump(exclude_unset=True)))
