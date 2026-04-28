"""add_unidade_id_to_integracoes

Revision ID: 89e716bfb81f
Revises: 5d740eb04415
Create Date: 2026-03-14 18:27:21.528686

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89e716bfb81f'
down_revision: Union[str, Sequence[str], None] = '5d740eb04415'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE integracoes ADD COLUMN IF NOT EXISTS unidade_id INTEGER REFERENCES unidades(id) ON DELETE CASCADE")
    op.execute("ALTER TABLE integracoes DROP CONSTRAINT IF EXISTS integracoes_empresa_id_tipo_key")
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ix_integracoes_empresa_tipo_unidade
        ON integracoes (empresa_id, tipo, unidade_id) WHERE unidade_id IS NOT NULL
    """)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ix_integracoes_empresa_tipo_global
        ON integracoes (empresa_id, tipo) WHERE unidade_id IS NULL
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS ix_integracoes_empresa_tipo_global")
    op.execute("DROP INDEX IF EXISTS ix_integracoes_empresa_tipo_unidade")
    op.execute("ALTER TABLE integracoes ADD CONSTRAINT integracoes_empresa_id_tipo_key UNIQUE (empresa_id, tipo)")
    op.execute("ALTER TABLE integracoes DROP COLUMN IF EXISTS unidade_id")
