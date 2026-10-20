import asyncio
import uuid
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.database import async_engine
from app.services.blacklist import token_blacklist


async def run_tests():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("\n=======================================================")
        print("--- 1. Testing Full-Text Product Search ---")
        print("=======================================================")

        # Search for "herbal"
        s1 = await client.get("/api/products?search=herbal")
        assert s1.status_code == 200
        herbal_prods = s1.json()
        print(f"  [PASSED] Search 'herbal' matched {len(herbal_prods)} products: {[p['name'] for p in herbal_prods]}")
        assert len(herbal_prods) >= 1

        # Search for "vitamin"
        s2 = await client.get("/api/products?search=vitamin")
        assert s2.status_code == 200
        vit_prods = s2.json()
        print(f"  [PASSED] Search 'vitamin' matched {len(vit_prods)} products: {[p['name'] for p in vit_prods]}")
        assert any("Vitamin" in p["name"] for p in vit_prods)

        # Search for ingredient "argan"
        s3 = await client.get("/api/products?search=argan")
        assert s3.status_code == 200
        argan_prods = s3.json()
        print(f"  [PASSED] Search 'argan' matched by ingredient in {len(argan_prods)} products: {[p['name'] for p in argan_prods]}")
        assert len(argan_prods) >= 1

        # Search for nonexistent term
        s4 = await client.get("/api/products?search=xyznonexistentterm123")
        assert s4.status_code == 200
        assert len(s4.json()) == 0
        print("  [PASSED] Nonexistent search term returns empty list.")

        print("\n=======================================================")
        print("--- 2. Testing Stock Validation in Cart ---")
        print("=======================================================")

        # Create fresh test user
        suffix = uuid.uuid4().hex[:6]
        username = f"stock_user_{suffix}"
        password = "SecurePassword@2026!"
        reg = await client.post(
            "/api/auth/register",
            json={
                "username": username,
                "email": f"{username}@example.com",
                "password": password,
            },
        )
        assert reg.status_code == 201

        login = await client.post(
            "/api/auth/login",
            json={"username": username, "password": password},
        )
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Admin login to create a limited stock test product
        admin_login = await client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        test_slug = f"limited-product-{suffix}"
        new_prod = await client.post(
            "/api/admin/products",
            headers=admin_headers,
            json={
                "name": f"Limited Botanical Oil {suffix}",
                "slug": test_slug,
                "price": 250,
                "category": "hair",
                "stock_quantity": 2,  # Exactly 2 units in stock
                "in_stock": True,
            },
        )
        assert new_prod.status_code == 201
        product_id = new_prod.json()["id"]
        print(f"  [PASSED] Admin created limited stock test product (ID {product_id}, stock: 2).")

        # Attempt to add 5 units to cart (exceeding stock of 2) -> Should be rejected with 400
        over_cart = await client.post(
            "/api/cart",
            headers=headers,
            json={"product_id": product_id, "size": 0, "quantity": 5},
        )
        assert over_cart.status_code == 400
        assert "available in stock" in over_cart.json()["detail"].lower()
        print(f"  [PASSED] Add-to-cart rejected excessive quantity: {over_cart.json()['detail']}")

        # Add allowable quantity (2 units) -> Should succeed
        valid_cart = await client.post(
            "/api/cart",
            headers=headers,
            json={"product_id": product_id, "size": 0, "quantity": 2},
        )
        assert valid_cart.status_code == 201
        cart_items = valid_cart.json()["items"]
        assert len(cart_items) == 1
        item = cart_items[0]
        assert item["stock_quantity"] == 2
        assert item["in_stock"] is True
        assert item["is_available"] is True
        print(f"  [PASSED] Added allowable quantity. CartItemOut verified: stock_qty={item['stock_quantity']}, is_available={item['is_available']}")

        # Attempt to update quantity to 3 -> Should fail
        cart_item_id = item["id"]
        update_over = await client.put(
            f"/api/cart/{cart_item_id}",
            headers=headers,
            json={"quantity": 3},
        )
        assert update_over.status_code == 400
        print(f"  [PASSED] Update cart item rejected exceeding stock: {update_over.json()['detail']}")

        print("\n=======================================================")
        print("--- 3. Testing Inventory Locking & Stock Decrement ---")
        print("=======================================================")

        # Top up wallet balance
        await client.post(
            "/api/wallet/add-funds",
            headers=headers,
            json={"amount": 5000, "description": "Wallet fund for checkout test"},
        )

        # Place order for the 2 units
        order_res = await client.post(
            "/api/orders",
            headers=headers,
            json={
                "shipping_name": "Test Customer",
                "shipping_phone": "9999999999",
                "shipping_address": "Test Street",
            },
        )
        assert order_res.status_code == 201
        order = order_res.json()
        print(f"  [PASSED] Order placed successfully: #{order['order_number']}")

        # Check product stock: should now be 0 and in_stock = False
        prod_check = await client.get(f"/api/products/{product_id}")
        assert prod_check.status_code == 200
        p_data = prod_check.json()
        assert p_data["stock_quantity"] == 0
        assert p_data["in_stock"] is False
        print(f"  [PASSED] Inventory atomically decremented to: stock_quantity={p_data['stock_quantity']}, in_stock={p_data['in_stock']}")

        # Second user attempt to buy the same product -> must fail with Out of Stock
        add_zero_stock = await client.post(
            "/api/cart",
            headers=headers,
            json={"product_id": product_id, "size": 0, "quantity": 1},
        )
        assert add_zero_stock.status_code == 400
        assert "out of stock" in add_zero_stock.json()["detail"].lower()
        print(f"  [PASSED] Prevented overselling: {add_zero_stock.json()['detail']}")

        print("\n=======================================================")
        print("--- 4. Testing Order Cancellation & Stock Restoration ---")
        print("=======================================================")

        cancel_res = await client.put(
            f"/api/admin/orders/{order['id']}/status?status=cancelled",
            headers=admin_headers,
        )
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "cancelled"
        print(f"  [PASSED] Admin updated order status to 'cancelled'.")

        # Verify stock was restored
        restored_check = await client.get(f"/api/products/{product_id}")
        assert restored_check.status_code == 200
        restored_p = restored_check.json()
        assert restored_p["stock_quantity"] == 2
        assert restored_p["in_stock"] is True
        print(f"  [PASSED] Inventory replenished: stock_quantity={restored_p['stock_quantity']}, in_stock={restored_p['in_stock']}")

        # Attempt to delete product with order history -> must be rejected with 400
        del_attempt = await client.delete(f"/api/admin/products/{product_id}", headers=admin_headers)
        assert del_attempt.status_code == 400
        assert "cannot delete product associated with existing customer orders" in del_attempt.json()["detail"].lower()
        print("  [PASSED] Delete protection prevented breaking order foreign key constraints.")

        # Deactivate product instead
        deactivate_res = await client.put(
            f"/api/admin/products/{product_id}",
            headers=admin_headers,
            json={"in_stock": False},
        )
        assert deactivate_res.status_code == 200
        assert deactivate_res.json()["in_stock"] is False
        print("  [PASSED] Product deactivated successfully.")

    await token_blacklist.close()
    await async_engine.dispose()
    print("\n=======================================================")
    print("ALL PRODUCT & ORDER LOGIC TESTS PASSED 100% SUCCESSFULLY!")
    print("=======================================================\n")


async def test_product_order_logic():
    """Standard pytest integration test runner for product and order logic."""
    await run_tests()


if __name__ == "__main__":
    asyncio.run(run_tests())

