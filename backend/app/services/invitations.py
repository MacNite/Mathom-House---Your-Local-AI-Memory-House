"""SMTP delivery and invite-token helpers."""

from __future__ import annotations

import hashlib
import secrets
import smtplib
import ssl
from email.message import EmailMessage
from urllib.parse import quote

from app.services.settings_store import SmtpConfig


def new_token() -> str:
    return secrets.token_urlsafe(32)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def send_invitation(config: SmtpConfig, recipient: str, name: str, token: str) -> None:
    if not config.configured:
        raise ValueError("SMTP is not configured")
    base_url = config.public_base_url.rstrip("/")
    if not base_url:
        raise ValueError("A public base URL is required to send invitations")
    url = f"{base_url}/register?token={quote(token)}"
    message = EmailMessage()
    message["Subject"] = "You are invited to Mathom"
    message["From"] = (
        f"{config.from_name} <{config.from_email}>" if config.from_name else config.from_email
    )
    message["To"] = recipient
    message.set_content(
        f"Hello {name or recipient},\n\nYou have been invited to Mathom. "
        f"Use this one-time link to set your password:\n\n{url}\n\n"
        f"This invitation expires in {config.invite_expiry_hours} hours."
    )
    context = ssl.create_default_context()
    if config.use_tls:
        with smtplib.SMTP(config.host, config.port, timeout=15) as server:
            server.starttls(context=context)
            server.login(config.username, config.password)
            server.send_message(message)
    else:
        with smtplib.SMTP_SSL(config.host, config.port, context=context, timeout=15) as server:
            server.login(config.username, config.password)
            server.send_message(message)
