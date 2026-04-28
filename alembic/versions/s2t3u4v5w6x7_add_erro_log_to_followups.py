"""add_erro_log_to_followups_and_prospect_id_evo_to_conversas

Revision ID: s2t3u4v5w6x7
Revises: r1s2t3u4v5w6
Create Date: 2026-04-02 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 's2t3u4v5w6x7'
down_revision: Union[str, Sequence[str], None] = 'r1s2t3u4v5w6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing columns referenced by application code."""
    op.execute("""
        ALTER TABLE followups
        ADD COLUMN IF NOT EXISTS erro_log TEXT
    """)
    op.execute("""
        ALTER TABLE conversas
        ADD COLUMN IF NOT EXISTS prospect_id_evo VARCHAR(100)
    """)


def downgrade() -> None:
    """Remove added columns."""
    op.drop_column('followups', 'erro_log')
    op.drop_column('conversas', 'prospect_id_evo')
