from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    Index,
    Integer,
    String,
    Text,
    column,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class RsvpStatus(str, enum.Enum):
    """Estado de confirmación de una tarjeta."""

    pendiente = "pendiente"
    si = "si"
    no = "no"


class Guest(Base):
    """
    Una fila = una tarjeta de invitación.

    - name único (case-insensitive) para upsert por nombre de tarjeta
    - passes acotado 1–12
    - status tipado con enum Postgres
    - invite_url opcional (cache del link público)
    - responded_at solo cuando status deja de ser pendiente
    """

    __tablename__ = "guests"
    __table_args__ = (
        CheckConstraint("passes >= 1 AND passes <= 12", name="ck_guests_passes_range"),
        Index("ix_guests_name_lower", func.lower(column("name")), unique=True),
        Index("ix_guests_status", "status"),
        Index("ix_guests_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    passes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=2,
        server_default="2",
    )
    status: Mapped[RsvpStatus] = mapped_column(
        Enum(
            RsvpStatus,
            name="rsvp_status",
            native_enum=True,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        default=RsvpStatus.pendiente,
        server_default=RsvpStatus.pendiente.value,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    invite_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    responded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
