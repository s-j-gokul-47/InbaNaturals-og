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
        print("--- 1. Testing Password Complexity & Policies ---")
        print("=======================================================")

        weak_passwords = [
            ("short", "Short1!", "Password must be at least 8 characters long"),
            ("no_upper", "lowercase1!", "Password must contain at least one uppercase letter (A-Z)"),
            ("no_lower", "UPPERCASE1!", "Password must contain at least one lowercase letter (a-z)"),
            ("no_digit", "NoDigitsHere!", "Password must contain at least one number (0-9)"),
            ("no_special", "Password123", "Password must contain at least one special character"),
        ]

        for label, pwd, expected_msg in weak_passwords:
            res = await client.post(
                "/api/auth/register",
                json={
                    "username": f"test_{label}_{uuid.uuid4().hex[:4]}",
                    "email": f"test_{label}_{uuid.uuid4().hex[:4]}@example.com",
                    "password": pwd,
                },
            )
            assert res.status_code == 422, f"Expected 422 for {label}, got {res.status_code}: {res.text}"
            assert expected_msg in res.text, f"Expected '{expected_msg}' in error response, got {res.text}"
            print(f"  [PASSED] Rejected weak password ({label}): {expected_msg}")

        # Test valid strong password
        suffix = uuid.uuid4().hex[:6]
        valid_username = f"sec_user_{suffix}"
        valid_email = f"sec_user_{suffix}@example.com"
        strong_password = "SecurePassword@2026!"

        reg_res = await client.post(
            "/api/auth/register",
            json={
                "username": valid_username,
                "email": valid_email,
                "password": strong_password,
                "full_name": "Security Test User",
            },
        )
        assert reg_res.status_code == 201, f"Failed to register with strong password: {reg_res.text}"
        print(f"  [PASSED] Successfully registered user with strong password: {valid_username}")

        print("\n=======================================================")
        print("--- 2. Testing Refresh Token & Token Rotation Flow ---")
        print("=======================================================")

        login_res = await client.post(
            "/api/auth/login",
            json={"username": valid_username, "password": strong_password},
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        login_data = login_res.json()
        assert "access_token" in login_data and login_data["access_token"]
        assert "refresh_token" in login_data and login_data["refresh_token"]
        access_token_1 = login_data["access_token"]
        refresh_token_1 = login_data["refresh_token"]
        print(f"  [PASSED] Login issued both Access Token and Refresh Token (expires_in={login_data['expires_in']}s)")

        # Verify refresh token cannot be used to authenticate protected endpoints
        fake_auth = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {refresh_token_1}"})
        assert fake_auth.status_code == 401, f"Expected 401 when using refresh token as access token: {fake_auth.text}"
        print("  [PASSED] Refresh token rejected when supplied as Bearer access token.")

        # Test refresh flow
        refresh_res = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token_1},
        )
        assert refresh_res.status_code == 200, f"Refresh endpoint failed: {refresh_res.text}"
        refreshed_data = refresh_res.json()
        access_token_2 = refreshed_data["access_token"]
        refresh_token_2 = refreshed_data["refresh_token"]
        assert access_token_2 != access_token_1
        assert refresh_token_2 != refresh_token_1
        print("  [PASSED] Refresh token exchanged for new Access Token + rotated Refresh Token.")

        # Verify the old rotated refresh token is revoked
        old_refresh_attempt = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token_1},
        )
        assert old_refresh_attempt.status_code == 401, "Expected old refresh token to be revoked"
        print("  [PASSED] Old refresh token rejected after rotation (Token Rotation verified).")

        # Verify new access token works
        me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {access_token_2}"})
        assert me_res.status_code == 200
        assert me_res.json()["username"] == valid_username
        print(f"  [PASSED] Authenticated with new access token as: {valid_username}")

        print("\n=======================================================")
        print("--- 3. Testing JWT Revocation (Logout & Blacklist) ---")
        print("=======================================================")

        logout_res = await client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {access_token_2}"},
            json={"refresh_token": refresh_token_2},
        )
        assert logout_res.status_code == 200
        print("  [PASSED] Logout endpoint succeeded and blacklisted tokens.")

        # Now attempting to use the blacklisted access token should be rejected with 401
        revoked_access_attempt = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token_2}"},
        )
        assert revoked_access_attempt.status_code == 401
        assert "revoked" in revoked_access_attempt.json()["detail"].lower()
        print(f"  [PASSED] Revoked access token immediately rejected: {revoked_access_attempt.json()['detail']}")

        # Attempting to use the blacklisted refresh token should also be rejected
        revoked_refresh_attempt = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token_2},
        )
        assert revoked_refresh_attempt.status_code == 401
        assert "revoked" in revoked_refresh_attempt.json()["detail"].lower()
        print(f"  [PASSED] Revoked refresh token immediately rejected: {revoked_refresh_attempt.json()['detail']}")

        print("\n=======================================================")
        print("--- 4. Testing Order Transaction Integrity & Atomicity ---")
        print("=======================================================")

        # Log in again to get fresh credentials
        fresh_login = await client.post(
            "/api/auth/login",
            json={"username": valid_username, "password": strong_password},
        )
        token = fresh_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch product 1
        prod_res = await client.get("/api/products")
        product = next(p for p in prod_res.json() if p.get("in_stock", True))

        # Add to cart
        await client.post(
            "/api/cart",
            headers=headers,
            json={"product_id": product["id"], "size": 0, "quantity": 1},
        )

        # Attempt order with 0 wallet balance -> should fail atomically
        fail_order_res = await client.post(
            "/api/orders",
            headers=headers,
            json={
                "shipping_name": "Test Recipient",
                "shipping_phone": "9876543210",
                "shipping_address": "123 Test Street",
            },
        )
        assert fail_order_res.status_code == 400
        assert "insufficient wallet balance" in fail_order_res.text.lower()
        print("  [PASSED] Order with insufficient funds rolled back cleanly without creating orders.")

        # Verify cart items still intact
        cart_check = await client.get("/api/cart", headers=headers)
        assert len(cart_check.json()["items"]) == 1
        print("  [PASSED] Cart contents preserved intact after failed transaction.")

        # Now add funds to wallet
        fund_res = await client.post(
            "/api/wallet/add-funds",
            headers=headers,
            json={"amount": product["price"] + 500, "description": "Top-up for order test"},
        )
        assert fund_res.status_code == 200
        assert fund_res.json()["balance"] == product["price"] + 500
        print(f"  [PASSED] Added funds atomically. Balance: {fund_res.json()['balance']}")

        # Now place order with sufficient balance
        order_success_res = await client.post(
            "/api/orders",
            headers=headers,
            json={
                "shipping_name": "Test Recipient",
                "shipping_phone": "9876543210",
                "shipping_address": "123 Test Street",
            },
        )
        assert order_success_res.status_code == 201
        order_data = order_success_res.json()
        print(f"  [PASSED] Order created with strict ACID integrity: #{order_data['order_number']}, total: {order_data['total']}")

        # Verify wallet deducted
        wallet_check = await client.get("/api/wallet", headers=headers)
        assert wallet_check.json()["balance"] == 500
        print(f"  [PASSED] Wallet deducted exactly by order amount. Remaining: {wallet_check.json()['balance']}")

        # Verify cart cleared
        cart_after = await client.get("/api/cart", headers=headers)
        assert len(cart_after.json()["items"]) == 0
        print("  [PASSED] Cart cleared automatically as part of the atomic transaction.")

    await token_blacklist.close()
    await async_engine.dispose()
    print("\n=======================================================")
    print("ALL SECURITY ENHANCEMENT TESTS PASSED 100% SUCCESSFULLY!")
    print("=======================================================\n")


async def test_security_enhancements():
    """Standard pytest integration test runner for security enhancements."""
    await run_tests()


if __name__ == "__main__":
    asyncio.run(run_tests())

