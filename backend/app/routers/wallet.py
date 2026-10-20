from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.wallet import WalletTransaction
from app.schemas.wallet import AddFundsRequest, WalletOut
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get("/wallet", response_model=WalletOut)
async def get_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(WalletTransaction)
        .where(WalletTransaction.user_id == current_user.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(50)
    )
    result = await db.execute(query)
    transactions = result.scalars().all()
    return WalletOut(balance=current_user.wallet_balance, transactions=transactions)


@router.post("/wallet/add-funds", response_model=WalletOut)
async def add_funds(
    payload: AddFundsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.amount < 1:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    try:
        user_stmt = select(User).where(User.id == current_user.id).with_for_update()
        user_res = await db.execute(user_stmt)
        locked_user = user_res.scalars().first()
        if not locked_user:
            raise HTTPException(status_code=404, detail="User not found")

        locked_user.wallet_balance += payload.amount
        db.add(WalletTransaction(
            user_id=locked_user.id,
            amount=payload.amount,
            type="credit",
            description=payload.description,
            balance_after=locked_user.wallet_balance,
        ))
        await db.commit()
        await db.refresh(locked_user)
    except HTTPException:
        await db.rollback()
        raise
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add funds: {exc}",
        )

    query = (
        select(WalletTransaction)
        .where(WalletTransaction.user_id == locked_user.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(50)
    )
    result = await db.execute(query)
    transactions = result.scalars().all()
    return WalletOut(balance=locked_user.wallet_balance, transactions=transactions)
