"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-05-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "branches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("branch_id", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("governorate", sa.String(), nullable=True),
        sa.Column("phone_number", sa.String(), nullable=True),
        sa.Column("allocated_amount_syp", sa.Float(), nullable=True),
        sa.Column("allocated_amount_usd", sa.Float(), nullable=True),
        sa.Column("allocated_amount", sa.Float(), nullable=True),
        sa.Column("tax_rate", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_branches_branch_id"), "branches", ["branch_id"], unique=True)
    op.create_index(op.f("ix_branches_id"), "branches", ["id"], unique=False)
    op.create_index(op.f("ix_branches_name"), "branches", ["name"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(), nullable=True),
        sa.Column("password", sa.String(), nullable=True),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("branch_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "branch_funds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("branch_id", sa.Integer(), nullable=True),
        sa.Column("amount", sa.Float(), nullable=True),
        sa.Column("type", sa.String(), nullable=True),
        sa.Column("currency", sa.String(), nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_branch_funds_id"), "branch_funds", ["id"], unique=False)

    op.create_table(
        "transactions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("sender", sa.String(), nullable=True),
        sa.Column("sender_mobile", sa.String(), nullable=True),
        sa.Column("sender_governorate", sa.String(), nullable=True),
        sa.Column("sender_location", sa.String(), nullable=True),
        sa.Column("receiver", sa.String(), nullable=True),
        sa.Column("receiver_mobile", sa.String(), nullable=True),
        sa.Column("amount", sa.Float(), nullable=True),
        sa.Column("base_amount", sa.Float(), nullable=True),
        sa.Column("benefited_amount", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("branch_id", sa.Integer(), nullable=True),
        sa.Column("destination_branch_id", sa.Integer(), nullable=True),
        sa.Column("tax_amount", sa.Float(), nullable=True),
        sa.Column("tax_rate", sa.Float(), nullable=True),
        sa.Column("employee_id", sa.Integer(), nullable=True),
        sa.Column("received_by", sa.Integer(), nullable=True),
        sa.Column("employee_name", sa.String(), nullable=True),
        sa.Column("branch_governorate", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("is_received", sa.Boolean(), nullable=True),
        sa.Column("received_at", sa.DateTime(), nullable=True),
        sa.Column("date", sa.DateTime(), nullable=True),
        sa.Column("receiver_governorate", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"]),
        sa.ForeignKeyConstraint(["destination_branch_id"], ["branches.id"]),
        sa.ForeignKeyConstraint(["employee_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["received_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_transaction_branch", "transactions", ["branch_id"], unique=False)
    op.create_index("idx_transaction_currency", "transactions", ["currency"], unique=False)
    op.create_index("idx_transaction_date", "transactions", ["date"], unique=False)
    op.create_index("idx_transaction_dates", "transactions", ["date", "branch_id", "currency", "status"], unique=False)
    op.create_index("idx_transaction_status", "transactions", ["status"], unique=False)
    op.create_index(op.f("ix_transactions_id"), "transactions", ["id"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("transaction_id", sa.String(), nullable=True),
        sa.Column("recipient_phone", sa.String(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)

    op.create_table(
        "branch_profits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("branch_id", sa.Integer(), nullable=True),
        sa.Column("transaction_id", sa.String(), nullable=True),
        sa.Column("profit_amount", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(), nullable=True),
        sa.Column("source_type", sa.String(), nullable=True),
        sa.Column("date", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"]),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_branch_profits_id"), "branch_profits", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_branch_profits_id"), table_name="branch_profits")
    op.drop_table("branch_profits")
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")
    op.drop_index(op.f("ix_transactions_id"), table_name="transactions")
    op.drop_index("idx_transaction_status", table_name="transactions")
    op.drop_index("idx_transaction_dates", table_name="transactions")
    op.drop_index("idx_transaction_date", table_name="transactions")
    op.drop_index("idx_transaction_currency", table_name="transactions")
    op.drop_index("idx_transaction_branch", table_name="transactions")
    op.drop_table("transactions")
    op.drop_index(op.f("ix_branch_funds_id"), table_name="branch_funds")
    op.drop_table("branch_funds")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_branches_name"), table_name="branches")
    op.drop_index(op.f("ix_branches_id"), table_name="branches")
    op.drop_index(op.f("ix_branches_branch_id"), table_name="branches")
    op.drop_table("branches")
