from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.guest import RsvpStatus


EstadoLiteral = Literal["pendiente", "si", "no"]


class ConfirmacionUpsert(BaseModel):
    """Payload compatible con el front actual (tarjeta / pases / estado)."""

    model_config = ConfigDict(extra="ignore")

    tarjeta: str = Field(min_length=1, max_length=160)
    pases: int = Field(default=2, ge=1, le=12)
    estado: EstadoLiteral = "pendiente"
    notas: str | None = None
    link: str | None = None

    @field_validator("tarjeta")
    @classmethod
    def normalize_tarjeta(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Falta el nombre de la tarjeta")
        return cleaned

    @field_validator("notas")
    @classmethod
    def normalize_notas(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class ConfirmacionDelete(BaseModel):
    id: UUID


class GuestPublic(BaseModel):
    """Fila tal como la consume el Registro / ConfirmBlock del front."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    tarjeta: str
    pases: int
    estado: EstadoLiteral
    fecha: str
    notas: str
    link: str

    @classmethod
    def from_guest(cls, guest: object) -> GuestPublic:
        status = getattr(guest, "status")
        estado = status.value if isinstance(status, RsvpStatus) else str(status)
        created_at: datetime = getattr(guest, "created_at")
        responded_at: datetime | None = getattr(guest, "responded_at")
        stamp = responded_at or created_at
        return cls(
            id=str(getattr(guest, "id")),
            tarjeta=getattr(guest, "name"),
            pases=int(getattr(guest, "passes")),
            estado=estado,  # type: ignore[arg-type]
            fecha=stamp.isoformat(),
            notas=getattr(guest, "notes") or "",
            link=getattr(guest, "invite_url") or "",
        )


class ConfirmacionListResponse(BaseModel):
    rows: list[GuestPublic]


class ConfirmacionUpsertResponse(BaseModel):
    rows: list[GuestPublic]
    row: GuestPublic
