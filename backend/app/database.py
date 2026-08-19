from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def _build_engine():
    kwargs = {"echo": settings.DEBUG, "pool_pre_ping": True, "pool_recycle": 3600}

    return create_engine(settings.DATABASE_URL, **kwargs)


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
