from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import quote, urlencode, urlsplit, urlunsplit
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.guest import Guest, RsvpStatus
from app.schemas.guest import ConfirmacionUpsert, GuestPublic


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def build_invite_url(tarjeta: str, pases: int) -> str:
    settings = get_settings()
    base = (settings.public_invite_url or "").strip() or "http://localhost:5173/"
    parts = urlsplit(base)
    query = urlencode(
        {"para": tarjeta, "pases": str(pases)},
        quote_via=quote,
    )
    return urlunsplit((parts.scheme, parts.netloc, parts.path or "/", query, ""))


def list_guests(db: Session) -> list[GuestPublic]:
    rows = db.scalars(select(Guest).order_by(Guest.created_at.desc())).all()
    return [GuestPublic.from_guest(row) for row in rows]


def upsert_guest(db: Session, payload: ConfirmacionUpsert) -> tuple[GuestPublic, list[GuestPublic]]:
    existing = db.scalar(
        select(Guest).where(func.lower(Guest.name) == payload.tarjeta.lower())
    )
    status = RsvpStatus(payload.estado)
    now = _utcnow()

    if existing is None:
        guest = Guest(
            name=payload.tarjeta,
            passes=payload.pases,
            status=status,
            notes=payload.notas,
            invite_url=payload.link or build_invite_url(payload.tarjeta, payload.pases),
            responded_at=now if status is not RsvpStatus.pendiente else None,
        )
        db.add(guest)
    else:
        guest = existing
        guest.passes = payload.pases
        guest.status = status
        if payload.notas is not None:
            guest.notes = payload.notas
        if payload.link:
            guest.invite_url = payload.link
        elif not guest.invite_url:
            guest.invite_url = build_invite_url(guest.name, guest.passes)
        guest.updated_at = now
        if status is RsvpStatus.pendiente:
            guest.responded_at = None
        else:
            guest.responded_at = now

    db.commit()
    db.refresh(guest)
    return GuestPublic.from_guest(guest), list_guests(db)


def delete_guest(db: Session, guest_id: UUID) -> list[GuestPublic]:
    guest = db.get(Guest, guest_id)
    if guest is not None:
        db.delete(guest)
        db.commit()
    return list_guests(db)
