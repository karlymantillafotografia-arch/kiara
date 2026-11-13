"""open guests for supabase anon/authenticated

Revision ID: a1b2c3d4e5f6
Revises: 3763707c00eb
Create Date: 2026-11-13 10:05:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "3763707c00eb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # El front habla con PostgREST (rol anon). Seguridad no es prioridad ahora.
    op.execute("GRANT USAGE ON SCHEMA public TO anon, authenticated")
    op.execute(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.guests TO anon, authenticated"
    )
    op.execute("GRANT USAGE ON TYPE public.rsvp_status TO anon, authenticated")
    op.execute("ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS guests_anon_all ON public.guests")
    op.execute(
        """
        CREATE POLICY guests_anon_all
        ON public.guests
        FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true)
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS guests_anon_all ON public.guests")
    op.execute("ALTER TABLE public.guests DISABLE ROW LEVEL SECURITY")
    op.execute(
        "REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.guests FROM anon, authenticated"
    )
    op.execute("REVOKE USAGE ON TYPE public.rsvp_status FROM anon, authenticated")
