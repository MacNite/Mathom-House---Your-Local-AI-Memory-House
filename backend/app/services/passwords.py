"""Password hashing service for Mathom-managed local accounts.

Argon2-cffi is a required backend dependency, so production authentication never
silently downgrades to a different algorithm based on its installation state.
"""

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

MIN_PASSWORD_LENGTH = 12
MAX_PASSWORD_LENGTH = 256
_hasher = PasswordHasher()  # argon2-cffi defaults use Argon2id


def validate_password(password: str) -> None:
    """Reject passwords outside the bounded local-password policy."""
    if not MIN_PASSWORD_LENGTH <= len(password) <= MAX_PASSWORD_LENGTH:
        raise ValueError(f"Password must be {MIN_PASSWORD_LENGTH}-{MAX_PASSWORD_LENGTH} characters")


def hash_password(password: str) -> str:
    """Return an Argon2id password hash; never persist plaintext passwords."""
    validate_password(password)
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    """Constant-time verification delegated to argon2-cffi."""
    if not password_hash:
        return False
    try:
        return _hasher.verify(password_hash, password)
    except (InvalidHashError, VerificationError):
        return False
