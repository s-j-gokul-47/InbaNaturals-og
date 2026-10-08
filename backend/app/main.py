from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import admin, auth, cart, orders, products, reviews, wallet
from app.utils.limiter import limiter
import app.models  # noqa: F401 — register all models with Base.metadata

logger = logging.getLogger("uvicorn.error")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Content-Security-Policy can be restrictive, so we'll add a basic one
        # Allow self and common CDNs if needed.
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; object-src 'none';"
        return response


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(SecurityHeadersMiddleware)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Global unhandled exception: {exc}", exc_info=True)
        if settings.DEBUG:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": str(exc)},
            )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(products.router, prefix="/api", tags=["products"])
    app.include_router(cart.router, prefix="/api", tags=["cart"])
    app.include_router(orders.router, prefix="/api", tags=["orders"])
    app.include_router(wallet.router, prefix="/api", tags=["wallet"])
    app.include_router(reviews.router, prefix="/api", tags=["reviews"])
    app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

    @app.get("/api/health")
    def health_check():
        return {"status": "ok", "app": settings.APP_NAME}

    return app


app = create_app()


@app.on_event("startup")
def on_startup():
    if not settings.DEBUG and "change" in settings.SECRET_KEY.lower():
        logger.warning("WARNING: Default SECRET_KEY in use while DEBUG=False. Please set a secure SECRET_KEY in environment variables.")
    Base.metadata.create_all(bind=engine)
