import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.admin import DashboardStats, RoleUpdate
from app.schemas.order import OrderOut
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.schemas.review import ReviewApprove, ReviewOut
from app.schemas.user import UserOut
from app.services.search import search_service
from app.utils.dependencies import get_admin_user

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    existing_res = await db.execute(select(Product).where(Product.slug == payload.slug))
    if existing_res.scalars().first():
        raise HTTPException(status_code=409, detail="Product with this slug already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)

    await search_service.sync_product({
        "id": product.id,
        "name": product.name,
        "tagline": product.tagline,
        "description": product.description,
        "ingredients": product.ingredients,
        "category": product.category,
        "price": product.price,
    })

    return product


@router.put("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    prod_res = await db.execute(select(Product).where(Product.id == product_id))
    product = prod_res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    await db.commit()
    await db.refresh(product)

    await search_service.sync_product({
        "id": product.id,
        "name": product.name,
        "tagline": product.tagline,
        "description": product.description,
        "ingredients": product.ingredients,
        "category": product.category,
        "price": product.price,
    })

    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    prod_res = await db.execute(select(Product).where(Product.id == product_id))
    product = prod_res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Prevent deleting product if existing customer orders reference it
    orders_check = await db.execute(select(OrderItem).where(OrderItem.product_id == product_id))
    if orders_check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product associated with existing customer orders. Mark it out of stock instead.",
        )

    await search_service.delete_product(product_id)
    await db.delete(product)
    await db.commit()


@router.get("/orders", response_model=list[OrderOut])
async def list_all_orders(
    status_filter: str = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    query = select(Order).order_by(Order.created_at.desc())
    if status_filter:
        query = query.where(Order.status == status_filter)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/orders/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: int,
    status_val: str = Query(..., alias="status"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    order_res = await db.execute(select(Order).where(Order.id == order_id))
    order = order_res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # If cancelling order, restore inventory stock
    if status_val == "cancelled" and order.status != "cancelled":
        try:
            items_list = json.loads(order.items) if isinstance(order.items, str) else order.items
            for it in items_list:
                prod_id = it.get("product_id")
                qty = it.get("quantity", 0)
                if prod_id and qty > 0:
                    p_res = await db.execute(
                        select(Product).where(Product.id == prod_id).with_for_update()
                    )
                    prod = p_res.scalars().first()
                    if prod:
                        if prod.stock_quantity is not None:
                            prod.stock_quantity += qty
                        prod.in_stock = True
        except Exception as err:
            logger.warning(f"Failed to restore stock for cancelled order #{order.id}: {err}")

    order.status = status_val
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/reviews", response_model=list[ReviewOut])
async def list_all_reviews(
    approved: bool = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    query = (
        select(Review, User.username)
        .outerjoin(User, Review.user_id == User.id)
        .order_by(Review.created_at.desc())
    )
    if approved is not None:
        query = query.where(Review.is_approved == approved)
    result = await db.execute(query)
    rows = result.all()

    return [
        ReviewOut(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            username=username if username else "Unknown",
            rating=r.rating,
            comment=r.comment,
            is_approved=r.is_approved,
            created_at=r.created_at,
        )
        for r, username in rows
    ]


@router.put("/reviews/{review_id}/approve", response_model=ReviewOut)
async def approve_review(
    review_id: int,
    payload: ReviewApprove,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    review_res = await db.execute(select(Review).where(Review.id == review_id))
    review = review_res.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_approved = payload.is_approved
    await db.commit()
    await db.refresh(review)

    user_res = await db.execute(select(User).where(User.id == review.user_id))
    user = user_res.scalars().first()
    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        username=user.username if user else "Unknown",
        rating=review.rating,
        comment=review.comment,
        is_approved=review.is_approved,
        created_at=review.created_at,
    )


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_products = (await db.execute(select(func.count(Product.id)))).scalar() or 0
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    total_revenue = (await db.execute(select(func.coalesce(func.sum(Order.total), 0)))).scalar() or 0
    pending_reviews = (
        await db.execute(select(func.count(Review.id)).where(Review.is_approved == False))
    ).scalar() or 0

    return DashboardStats(
        total_users=total_users,
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=total_revenue,
        pending_reviews=pending_reviews,
    )


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.put("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    if payload.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    review_res = await db.execute(select(Review).where(Review.id == review_id))
    review = review_res.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    await db.delete(review)
    await db.commit()
