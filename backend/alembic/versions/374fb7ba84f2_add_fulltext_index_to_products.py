"""add fulltext index to products

Revision ID: 374fb7ba84f2
Revises: a47cbbbf8d97
Create Date: 2026-10-15 15:45:36.990192

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '374fb7ba84f2'
down_revision: Union[str, Sequence[str], None] = 'a47cbbbf8d97'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE products ADD FULLTEXT INDEX idx_products_fulltext (name, tagline, description, ingredients)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE products DROP INDEX idx_products_fulltext")
