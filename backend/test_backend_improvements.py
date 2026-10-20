import asyncio
import time
import uuid
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.database import async_engine


async def run_tests():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("\n--- 1. Testing Health Check ---")
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        data = res.json()
        print(f"Health check passed: {data}")

        print("\n--- 2. Testing User Registration & BackgroundTasks Email ---")
        random_suffix = uuid.uuid4().hex[:6]
        username = f"user_{random_suffix}"
        email = f"user_{random_suffix}@example.com"
        password = "Password123!"

        start_time = time.perf_counter()
        reg_res = await client.post(
            "/api/auth/register",
            json={
                "username": username,
                "email": email,
                "password": password,
                "full_name": "Test User",
            },
        )
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
        reg_data = reg_res.json()
        print(f"Registration succeeded in {elapsed_ms:.2f}ms (non-blocking email in background): {reg_data['username']}")

        print("\n--- 3. Testing User Login ---")
        login_res = await client.post(
            "/api/auth/login",
            json={"username": username, "password": password},
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        print("Login succeeded, JWT token received.")

        auth_headers = {"Authorization": f"Bearer {token}"}

        print("\n--- 4. Testing Authenticated /api/auth/me ---")
        me_res = await client.get("/api/auth/me", headers=auth_headers)
        assert me_res.status_code == 200, f"Get me failed: {me_res.text}"
        me_data = me_res.json()
        assert me_data["username"] == username
        print(f"Auth me confirmed: {me_data['username']} ({me_data['email']})")

        print("\n--- 5. Testing Product Listing ---")
        prod_res = await client.get("/api/products")
        assert prod_res.status_code == 200, f"Product listing failed: {prod_res.text}"
        products = prod_res.json()
        print(f"Retrieved {len(products)} products.")
        assert len(products) > 0, "No products found in DB"
        first_product = next(p for p in products if p.get("in_stock", True))

        print(f"\n--- 6. Testing Product Detail (slug: {first_product['slug']}) ---")
        detail_res = await client.get(f"/api/products/slug/{first_product['slug']}")
        assert detail_res.status_code == 200, f"Product detail failed: {detail_res.text}"
        assert detail_res.json()["id"] == first_product["id"]
        print(f"Product detail verified: {detail_res.json()['name']}")

        print("\n--- 7. Testing Cart Operations ---")
        add_cart_res = await client.post(
            "/api/cart",
            headers=auth_headers,
            json={"product_id": first_product["id"], "size": 0, "quantity": 2},
        )
        assert add_cart_res.status_code == 201, f"Add to cart failed: {add_cart_res.text}"
        cart_data = add_cart_res.json()
        print(f"Added to cart: {len(cart_data['items'])} items, total: {cart_data['total']}")
        assert len(cart_data["items"]) == 1
        item_id = cart_data["items"][0]["id"]

        del_cart_res = await client.delete(f"/api/cart/{item_id}", headers=auth_headers)
        assert del_cart_res.status_code == 200, f"Remove from cart failed: {del_cart_res.text}"
        print(f"Removed cart item. New total: {del_cart_res.json()['total']}")

        print("\n--- 8. Testing Admin Dashboard ---")
        admin_login_res = await client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
        admin_token = admin_login_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        dash_res = await client.get("/api/admin/dashboard", headers=admin_headers)
        assert dash_res.status_code == 200, f"Admin dashboard failed: {dash_res.text}"
        dash_data = dash_res.json()
        print(f"Dashboard Stats: users={dash_data['total_users']}, products={dash_data['total_products']}, orders={dash_data['total_orders']}")

    await async_engine.dispose()
    print("\n==========================================")
    print("ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==========================================\n")


async def test_backend_improvements():
    """Standard pytest integration test runner for backend improvements."""
    await run_tests()


if __name__ == "__main__":
    asyncio.run(run_tests())

