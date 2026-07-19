"""Collections: named shelves of Mathoms."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import current_user, owned_filter, owns
from app.models import Collection, Mathom, User
from app.schemas import CollectionCreate, CollectionOut, CollectionUpdate

router = APIRouter(prefix="/collections", tags=["collections"])


def _get_collection(collection_id: int, db: Session, user: User | None) -> Collection:
    collection = db.get(Collection, collection_id)
    if collection is None or not owns(collection, user):
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection


@router.get("", response_model=list[CollectionOut])
def list_collections(
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> list[Collection]:
    query = select(Collection).where(owned_filter(Collection, user)).order_by(Collection.name)
    return list(db.execute(query).scalars())


@router.post("", response_model=CollectionOut, status_code=201)
def create_collection(
    payload: CollectionCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> Collection:
    exists = db.execute(
        select(Collection.id).where(Collection.name == payload.name, owned_filter(Collection, user))
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="A collection with this name already exists")
    collection = Collection(
        name=payload.name,
        description=payload.description,
        user_id=user.id if user else None,
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection


@router.get("/{collection_id}", response_model=CollectionOut)
def get_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> Collection:
    return _get_collection(collection_id, db, user)


@router.put("/{collection_id}", response_model=CollectionOut)
def update_collection(
    collection_id: int,
    payload: CollectionUpdate,
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> Collection:
    collection = _get_collection(collection_id, db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(collection, field, value)
    db.commit()
    db.refresh(collection)
    return collection


@router.delete("/{collection_id}", status_code=204)
def delete_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> Response:
    collection = _get_collection(collection_id, db, user)
    db.delete(collection)
    db.commit()
    return Response(status_code=204)


def _get_owned_mathom(mathom_id: int, db: Session, user: User | None) -> Mathom:
    mathom = db.get(Mathom, mathom_id)
    if mathom is None or not owns(mathom, user):
        raise HTTPException(status_code=404, detail="Mathom not found")
    return mathom


@router.post("/{collection_id}/mathoms/{mathom_id}", response_model=CollectionOut)
def add_mathom(
    collection_id: int,
    mathom_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> Collection:
    collection = _get_collection(collection_id, db, user)
    mathom = _get_owned_mathom(mathom_id, db, user)
    if mathom not in collection.mathoms:
        collection.mathoms.append(mathom)
    db.commit()
    db.refresh(collection)
    return collection


@router.delete("/{collection_id}/mathoms/{mathom_id}", response_model=CollectionOut)
def remove_mathom(
    collection_id: int,
    mathom_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(current_user),
) -> Collection:
    collection = _get_collection(collection_id, db, user)
    collection.mathoms = [m for m in collection.mathoms if m.id != mathom_id]
    db.commit()
    db.refresh(collection)
    return collection
