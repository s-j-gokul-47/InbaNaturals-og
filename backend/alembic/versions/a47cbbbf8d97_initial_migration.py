"""Initial migration

Revision ID: a47cbbbf8d97
Revises: 
Create Date: 2026-10-15 13:57:25.490449

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a47cbbbf8d97'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    # Users table
    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("username", sa.String(length=50), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("password_hash", sa.String(length=255), nullable=False),
            sa.Column("full_name", sa.String(length=100), nullable=True),
            sa.Column("role", sa.String(length=20), nullable=True),
            sa.Column("wallet_balance", sa.Integer(), nullable=True),
            sa.Column("is_verified", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
        op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
        op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    # Products table
    if "products" not in existing_tables:
        op.create_table(
            "products",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("name", sa.String(length=100), nullable=False),
            sa.Column("slug", sa.String(length=100), nullable=False),
            sa.Column("tagline", sa.String(length=200), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("price", sa.Integer(), nullable=False),
            sa.Column("original_price", sa.Integer(), nullable=True),
            sa.Column("category", sa.String(length=20), nullable=False),
            sa.Column("sizes", sa.Text(), nullable=True),
            sa.Column("ingredients", sa.Text(), nullable=True),
            sa.Column("how_to_use", sa.Text(), nullable=True),
            sa.Column("image_url", sa.String(length=500), nullable=True),
            sa.Column("in_stock", sa.Boolean(), nullable=True),
            sa.Column("stock_quantity", sa.Integer(), nullable=True),
            sa.Column("is_featured", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_products_id"), "products", ["id"], unique=False)
        op.create_index(op.f("ix_products_slug"), "products", ["slug"], unique=True)

    # Cart items table
    if "cart_items" not in existing_tables:
        op.create_table(
            "cart_items",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("size", sa.Integer(), nullable=True),
            sa.Column("quantity", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_cart_items_id"), "cart_items", ["id"], unique=False)

    # Orders table
    if "orders" not in existing_tables:
        op.create_table(
            "orders",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("order_number", sa.String(length=20), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("items", sa.Text(), nullable=True),
            sa.Column("subtotal", sa.Integer(), nullable=True),
            sa.Column("discount", sa.Integer(), nullable=True),
            sa.Column("total", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=True),
            sa.Column("shipping_name", sa.String(length=100), nullable=True),
            sa.Column("shipping_phone", sa.String(length=20), nullable=True),
            sa.Column("shipping_address", sa.Text(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("order_number"),
        )
        op.create_index(op.f("ix_orders_id"), "orders", ["id"], unique=False)

    # Order items table
    if "order_items" not in existing_tables:
        op.create_table(
            "order_items",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("order_id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("product_name", sa.String(length=100), nullable=False),
            sa.Column("size", sa.String(length=20), nullable=True),
            sa.Column("quantity", sa.Integer(), nullable=True),
            sa.Column("unit_price", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_order_items_id"), "order_items", ["id"], unique=False)

    # Reviews table
    if "reviews" not in existing_tables:
        op.create_table(
            "reviews",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("rating", sa.Integer(), nullable=False),
            sa.Column("comment", sa.Text(), nullable=True),
            sa.Column("is_approved", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_reviews_id"), "reviews", ["id"], unique=False)

    # Wallet transactions table
    if "wallet_transactions" not in existing_tables:
        op.create_table(
            "wallet_transactions",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("type", sa.String(length=10), nullable=False),
            sa.Column("description", sa.String(length=255), nullable=True),
            sa.Column("balance_after", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_wallet_transactions_id"), "wallet_transactions", ["id"], unique=False)


def downgrade() -> None:
    op.drop_table("wallet_transactions")
    op.drop_table("reviews")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("cart_items")
    op.drop_table("products")
    op.drop_table("users")
