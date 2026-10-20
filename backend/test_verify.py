import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(async_client: AsyncClient):
    """Verify that the FastAPI health endpoint returns 200 OK and proper metadata."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "InbaNaturals" in data["app"]


@pytest.mark.asyncio
async def test_public_products_endpoint(async_client: AsyncClient):
    """Verify that products endpoint is accessible without authentication."""
    response = await async_client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_contact_form_submission(async_client: AsyncClient):
    """Verify that POST /api/contact receives messages and dispatches notifications."""
    response = await async_client.post(
        "/api/contact",
        json={
            "name": "Kavya Ramesh",
            "email": "kavya@example.com",
            "subject": "Hair Oil Recommendation",
            "message": "Hello, could you suggest which hair pack goes best with the Abha hair oil?",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "received" in data["message"].lower()
