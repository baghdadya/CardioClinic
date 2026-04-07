"""add rxcui and interactions_synced_at to medications_master

Revision ID: a3f7c1e92d01
Revises: d5d4ac8859ba
Create Date: 2026-04-06 23:59:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f7c1e92d01'
down_revision: Union[str, None] = 'd5d4ac8859ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('medications_master', sa.Column('rxcui', sa.String(length=20), nullable=True))
    op.add_column('medications_master', sa.Column('interactions_synced_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('medications_master', 'interactions_synced_at')
    op.drop_column('medications_master', 'rxcui')
