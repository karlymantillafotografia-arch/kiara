"""guests id default gen_random_uuid

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-11-13 10:10:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgREST/anon inserts need DB-side defaults (SQLAlchemy defaults are solo Python).
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.execute(
        "ALTER TABLE public.guests ALTER COLUMN id SET DEFAULT gen_random_uuid()"
    )
    op.execute("ALTER TABLE public.guests ALTER COLUMN passes SET DEFAULT 2")


def downgrade() -> None:
    op.execute("ALTER TABLE public.guests ALTER COLUMN passes DROP DEFAULT")
    op.execute("ALTER TABLE public.guests ALTER COLUMN id DROP DEFAULT")
