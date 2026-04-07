"""add admin role

Revision ID: b8e2f4a1c3d5
Revises: a3f7c1e92d01
Create Date: 2026-04-07 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b8e2f4a1c3d5"
down_revision: Union[str, None] = "a3f7c1e92d01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin' BEFORE 'doctor'")
    op.execute("ALTER TABLE patients ALTER COLUMN phone TYPE varchar(50)")
    op.execute("ALTER TABLE patients ALTER COLUMN phone_alt TYPE varchar(50)")
    op.execute("ALTER TABLE patients ALTER COLUMN smoking_packs_day TYPE numeric(5,1)")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values
    pass
