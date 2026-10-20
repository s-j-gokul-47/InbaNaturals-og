import time

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.services.blacklist import token_blacklist
from app.services.email import send_verification_email
from app.utils.dependencies import get_current_user, oauth2_scheme
from app.utils.limiter import limiter
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(
        or_(User.username == payload.username, User.email == payload.email)
    )
    result = await db.execute(query)
    existing = result.scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already registered",
        )

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    verify_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "purpose": "email_verify"},
        expires_delta=None,
    )

    # Offload email dispatch to BackgroundTasks so response is non-blocking
    background_tasks.add_task(send_verification_email, user.email, verify_token, user.full_name)

    return user


@router.get("/verify-email", response_model=MessageResponse)
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    payload = decode_access_token(token)
    if payload is None or payload.get("purpose") != "email_verify":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return MessageResponse(message="Email already verified")

    user.is_verified = True
    await db.commit()
    return MessageResponse(message="Email verified successfully")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == payload.username))
    user = result.scalars().first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh_access_token(
    request: Request,
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    decoded = decode_access_token(payload.refresh_token)
    if decoded is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    if decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not a valid refresh token",
        )

    jti = decoded.get("jti")
    if jti and await token_blacklist.is_token_revoked(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    user_id = decoded.get("sub")
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token subject")

    user_res = await db.execute(select(User).where(User.id == user_id_int))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Rotate refresh token: revoke current refresh token for its remaining TTL
    exp = decoded.get("exp")
    if jti and exp:
        remaining_ttl = exp - int(time.time())
        if remaining_ttl > 0:
            await token_blacklist.revoke_token(jti, remaining_ttl)

    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    payload: LogoutRequest = LogoutRequest(),
    raw_token: str = Depends(oauth2_scheme),
):
    now = int(time.time())

    # Revoke access token if present
    if raw_token:
        decoded_access = decode_access_token(raw_token)
        if decoded_access:
            access_jti = decoded_access.get("jti")
            exp = decoded_access.get("exp")
            if access_jti and exp:
                ttl = max(1, exp - now)
                await token_blacklist.revoke_token(access_jti, ttl)

    # Revoke refresh token if provided
    if payload.refresh_token:
        decoded_refresh = decode_access_token(payload.refresh_token)
        if decoded_refresh:
            refresh_jti = decoded_refresh.get("jti")
            exp = decoded_refresh.get("exp")
            if refresh_jti and exp:
                ttl = max(1, exp - now)
                await token_blacklist.revoke_token(refresh_jti, ttl)

    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
