import json
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.models.wallet import WalletTransaction
from app.schemas.order import CreateOrderRequest, OrderListOut, OrderOut
from app.services.email import send_order_confirmation_email
from app.utils.dependencies import get_current_user

router = APIRouter()


def _generate_order_number() -> str:
    return "IN" + datetime.utcnow().strftime("%y%m%d%H%M%S%f")[:-3]


@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: CreateOrderRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        cart_res = await db.execute(select(CartItem).where(CartItem.user_id == current_user.id))
        cart_items = cart_res.scalars().all()
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        # Row-level lock on User to prevent concurrent double-spending race conditions
        user_stmt = select(User).where(User.id == current_user.id).with_for_update()
        user_res = await db.execute(user_stmt)
        locked_user = user_res.scalars().first()
        if not locked_user:
            raise HTTPException(status_code=404, detail="User not found")

        items_data = []
        subtotal = 0

        # Validate inventory and lock product rows
        for ci in cart_items:
            prod_stmt = select(Product).where(Product.id == ci.product_id).with_for_update()
            prod_res = await db.execute(prod_stmt)
            product = prod_res.scalars().first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {ci.product_id} no longer exists")

            if not product.in_stock or (product.stock_quantity is not None and product.stock_quantity < ci.quantity):
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}. Available: {product.stock_quantity or 0}",
                )

            sizes = []
            try:
                sizes = json.loads(product.sizes) if isinstance(product.sizes, str) else product.sizes
            except (json.JSONDecodeError, TypeError):
                pass
            size_label = sizes[ci.size] if isinstance(sizes, list) and ci.size < len(sizes) else ""

            items_data.append({
                "product_id": product.id,
                "product_name": product.name,
                "size": size_label,
                "quantity": ci.quantity,
                "unit_price": product.price,
            })
            subtotal += product.price * ci.quantity

            # Decrement inventory stock
            if product.stock_quantity is not None:
                product.stock_quantity -= ci.quantity
                if product.stock_quantity <= 0:
                    product.in_stock = False

        total = subtotal

        if locked_user.wallet_balance < total:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient wallet balance. Required: {total}, available: {locked_user.wallet_balance}",
            )

        order_number = _generate_order_number()
        order = Order(
            order_number=order_number,
            user_id=locked_user.id,
            items=json.dumps(items_data),
            subtotal=subtotal,
            discount=0,
            total=total,
            status="confirmed",
            shipping_name=payload.shipping_name,
            shipping_phone=payload.shipping_phone,
            shipping_address=payload.shipping_address,
            notes=payload.notes,
        )
        db.add(order)
        await db.flush()

        for item in items_data:
            db.add(OrderItem(
                order_id=order.id,
                product_id=item["product_id"],
                product_name=item["product_name"],
                size=item["size"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
            ))

        locked_user.wallet_balance -= total
        db.add(WalletTransaction(
            user_id=locked_user.id,
            amount=-total,
            type="debit",
            description=f"Order #{order_number}",
            balance_after=locked_user.wallet_balance,
        ))

        await db.execute(delete(CartItem).where(CartItem.user_id == locked_user.id))
        await db.commit()
        await db.refresh(order)

        # Offload confirmation email to background tasks
        background_tasks.add_task(
            send_order_confirmation_email,
            locked_user.email,
            {
                "order_number": order.order_number,
                "items": items_data,
                "subtotal": subtotal,
                "discount": order.discount,
                "total": total,
                "shipping_name": payload.shipping_name,
                "shipping_address": payload.shipping_address,
                "shipping_phone": payload.shipping_phone,
            },
        )

        return order

    except HTTPException:
        await db.rollback()
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order processing failed: {exc}",
        )


@router.get("/orders", response_model=list[OrderListOut])
async def list_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/orders/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
