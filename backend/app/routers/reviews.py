from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get("/products/{product_id}/reviews", response_model=list[ReviewOut])
async def list_reviews(product_id: int, db: AsyncSession = Depends(get_db)):
    prod_res = await db.execute(select(Product).where(Product.id == product_id))
    product = prod_res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    query = (
        select(Review, User.username)
        .outerjoin(User, Review.user_id == User.id)
        .where(Review.product_id == product_id, Review.is_approved == True)
        .order_by(Review.created_at.desc())
    )
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


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    product_id: int,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prod_res = await db.execute(select(Product).where(Product.id == product_id))
    product = prod_res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_res = await db.execute(
        select(Review).where(
            Review.product_id == product_id,
            Review.user_id == current_user.id,
        )
    )
    if existing_res.scalars().first():
        raise HTTPException(status_code=409, detail="You have already reviewed this product")

    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        username=current_user.username,
        rating=review.rating,
        comment=review.comment,
        is_approved=review.is_approved,
        created_at=review.created_at,
    )
