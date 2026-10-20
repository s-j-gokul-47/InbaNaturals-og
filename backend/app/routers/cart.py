import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemOut, CartItemUpdate, CartOut
from app.utils.dependencies import get_current_user

router = APIRouter()


def _parse_sizes(product: Product) -> list[str]:
    try:
        sizes = json.loads(product.sizes) if isinstance(product.sizes, str) else product.sizes
        return sizes if isinstance(sizes, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def _cart_item_to_out(item: CartItem, product: Product) -> CartItemOut:
    sizes = _parse_sizes(product)
    size_label = sizes[item.size] if item.size < len(sizes) else ""
    stock_qty = product.stock_quantity if product.stock_quantity is not None else 0
    in_stock = bool(product.in_stock and stock_qty > 0)
    is_available = bool(in_stock and stock_qty >= item.quantity)
    return CartItemOut(
        id=item.id,
        product_id=item.product_id,
        size=item.size,
        quantity=item.quantity,
        product_name=product.name,
        product_slug=product.slug,
        product_price=product.price,
        product_original_price=product.original_price,
        product_image=product.image_url,
        product_category=product.category,
        size_label=size_label,
        stock_quantity=stock_qty,
        in_stock=in_stock,
        is_available=is_available,
    )


async def _build_cart(user_id: int, db: AsyncSession) -> CartOut:
    query = (
        select(CartItem, Product)
        .join(Product, CartItem.product_id == Product.id)
        .where(CartItem.user_id == user_id)
    )
    result = await db.execute(query)
    rows = result.all()
    items_out = []
    total = 0
    for item, product in rows:
        out = _cart_item_to_out(item, product)
        items_out.append(out)
        total += product.price * item.quantity

    return CartOut(items=items_out, total=total)


@router.get("/cart", response_model=CartOut)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _build_cart(current_user.id, db)


@router.post("/cart", response_model=CartOut, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    payload: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product_res = await db.execute(select(Product).where(Product.id == payload.product_id))
    product = product_res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not product.in_stock or (product.stock_quantity is not None and product.stock_quantity < 1):
        raise HTTPException(status_code=400, detail=f"{product.name} is currently out of stock")

    existing_res = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == payload.product_id,
            CartItem.size == payload.size,
        )
    )
    existing = existing_res.scalars().first()
    total_requested = payload.quantity + (existing.quantity if existing else 0)

    if product.stock_quantity is not None and total_requested > product.stock_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add {payload.quantity} more. Only {product.stock_quantity} available in stock.",
        )

    if existing:
        existing.quantity += payload.quantity
    else:
        existing = CartItem(
            user_id=current_user.id,
            product_id=payload.product_id,
            size=payload.size,
            quantity=payload.quantity,
        )
        db.add(existing)

    await db.commit()
    return await _build_cart(current_user.id, db)


@router.put("/cart/{item_id}", response_model=CartOut)
async def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id,
        )
    )
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if payload.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    # Validate against live product stock
    prod_res = await db.execute(select(Product).where(Product.id == item.product_id))
    product = prod_res.scalars().first()
    if product and product.stock_quantity is not None and payload.quantity > product.stock_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity ({payload.quantity}) exceeds available stock ({product.stock_quantity}).",
        )

    item.quantity = payload.quantity
    await db.commit()
    return await _build_cart(current_user.id, db)


@router.delete("/cart/{item_id}", response_model=CartOut)
async def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id,
        )
    )
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    await db.delete(item)
    await db.commit()
    return await _build_cart(current_user.id, db)
