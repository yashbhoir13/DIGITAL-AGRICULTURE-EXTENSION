"""Initial schema — autogenerate-compatible revision.

Revision ID: 001_initial
"""

from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Prefer SQLAlchemy create_all via app startup for the academic prototype.
    # This revision documents the migration workflow; run `alembic revision --autogenerate`
    # after model changes in a full team environment.
    pass


def downgrade() -> None:
    pass
