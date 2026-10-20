import asyncio
from typing import AsyncGenerator
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.database import AsyncSessionLocal, async_engine
from app.services.blacklist import token_blacklist


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


def pytest_sessionfinish(session, exitstatus):
    """Cleanly close database pools and background connections upon test session completion."""
    async def _close():
        await token_blacklist.close()
        await async_engine.dispose()

    try:
        asyncio.run(_close())
    except Exception:
        pass


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Provide an AsyncClient instance connected to the FastAPI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide an isolated database session for database-level assertions."""
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture
def mock_smtp():
    """Mock aiosmtplib.send to inspect dispatched emails without network traffic."""
    with patch("aiosmtplib.send", new_callable=AsyncMock) as mocked_send:
        mocked_send.return_value = ({}, "250 Message accepted")
        yield mocked_send
