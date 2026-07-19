"""User administration. Owner manages roles; Admins manage plain users."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import authenticated_user, require_admin, require_owner
from app.models import ROLE_OWNER, ROLE_USER, User
from app.schemas import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _get_user(user_id: int, db: Session) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _active_owner_count(db: Session, exclude_id: int) -> int:
    return int(
        db.execute(
            select(func.count(User.id)).where(
                User.role == ROLE_OWNER, User.is_active.is_(True), User.id != exclude_id
            )
        ).scalar_one()
    )


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)) -> list[User]:
    return list(db.execute(select(User).order_by(User.created_at)).scalars())


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(authenticated_user),
) -> User:
    target = _get_user(user_id, db)
    changes = payload.model_dump(exclude_unset=True)

    # Admins (non-owners) may only toggle activation on plain users.
    if actor.role != ROLE_OWNER:
        if "role" in changes:
            raise HTTPException(status_code=403, detail="Only the Owner can change roles")
        if target.role != ROLE_USER:
            raise HTTPException(status_code=403, detail="Admins can only manage regular users")

    # Never let the last active Owner be demoted or deactivated (lockout guard).
    losing_owner = target.role == ROLE_OWNER and (
        changes.get("role", ROLE_OWNER) != ROLE_OWNER or changes.get("is_active") is False
    )
    if losing_owner and _active_owner_count(db, exclude_id=target.id) == 0:
        raise HTTPException(status_code=409, detail="Cannot remove the last active Owner")

    for field, value in changes.items():
        setattr(target, field, value)
    db.commit()
    db.refresh(target)
    return target


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> Response:
    target = _get_user(user_id, db)
    if target.id == owner.id:
        raise HTTPException(status_code=409, detail="You cannot delete your own account")
    if target.role == ROLE_OWNER and _active_owner_count(db, exclude_id=target.id) == 0:
        raise HTTPException(status_code=409, detail="Cannot delete the last active Owner")
    db.delete(target)
    db.commit()
    return Response(status_code=204)
