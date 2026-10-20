import pytest
from unittest.mock import AsyncMock, patch
import aiosmtplib

from app.config import settings
from app.services.email import send_verification_email, send_order_confirmation_email


@pytest.mark.asyncio
async def test_verification_email_mock_mode():
    """When SMTP credentials are not configured, email service logs mock output and returns True."""
    with patch.object(settings, "SMTP_USER", ""):
        with patch.object(settings, "SMTP_PASS", ""):
            success = await send_verification_email("customer@example.com", "sample-token-123", "Priya")
            assert success is True


@pytest.mark.asyncio
async def test_verification_email_with_smtp():
    """When SMTP is configured, aiosmtplib.send is invoked with the constructed EmailMessage."""
    with patch.object(settings, "SMTP_USER", "apikey"):
        with patch.object(settings, "SMTP_PASS", "SG.test-secret-token"):
            with patch.object(settings, "SMTP_HOST", "smtp.sendgrid.net"):
                with patch.object(settings, "SMTP_PORT", 587):
                    with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
                        mock_send.return_value = ({}, "250 OK")
                        success = await send_verification_email(
                            "testuser@example.com",
                            "verification-token-xyz",
                            "Gokul",
                        )
                        assert success is True
                        assert mock_send.called
                        call_args, call_kwargs = mock_send.call_args
                        msg = call_args[0]
                        assert msg["To"] == "testuser@example.com"
                        assert "Verify your InbaNaturals account" in msg["Subject"]
                        assert call_kwargs["hostname"] == "smtp.sendgrid.net"
                        assert call_kwargs["port"] == 587
                        assert call_kwargs["username"] == "apikey"


@pytest.mark.asyncio
async def test_order_confirmation_email_mock_mode():
    """When SMTP is not configured, order confirmation gracefully logs and returns True."""
    with patch.object(settings, "SMTP_USER", ""):
        with patch.object(settings, "SMTP_PASS", ""):
            order_data = {
                "order_number": "IN261020001",
                "items": [
                    {"product_name": "Herbal Hair Oil", "size": "100ml", "quantity": 2, "unit_price": 499},
                    {"product_name": "Glow Face Serum", "size": "30ml", "quantity": 1, "unit_price": 599},
                ],
                "subtotal": 1597,
                "discount": 0,
                "total": 1597,
                "shipping_name": "Ananya",
                "shipping_address": "123 Green Way, Bangalore",
                "shipping_phone": "9876543210",
            }
            success = await send_order_confirmation_email("ananya@example.com", order_data)
            assert success is True


@pytest.mark.asyncio
async def test_order_confirmation_email_with_smtp():
    """When SMTP is configured, order confirmation sends itemized invoice via aiosmtplib."""
    with patch.object(settings, "SMTP_USER", "ses_user"):
        with patch.object(settings, "SMTP_PASS", "ses_pass"):
            with patch.object(settings, "SMTP_HOST", "email-smtp.us-east-1.amazonaws.com"):
                with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
                    mock_send.return_value = ({}, "250 OK")
                    order_data = {
                        "order_number": "IN261020999",
                        "items": [
                            {"product_name": "Purifying Face Pack", "size": "50g", "quantity": 1, "unit_price": 399},
                        ],
                        "subtotal": 399,
                        "discount": 0,
                        "total": 399,
                        "shipping_name": "Meera",
                        "shipping_address": "456 Lotus St, Chennai",
                    }
                    success = await send_order_confirmation_email("meera@example.com", order_data)
                    assert success is True
                    assert mock_send.called
                    msg = mock_send.call_args[0][0]
                    assert msg["To"] == "meera@example.com"
                    assert "IN261020999" in msg["Subject"]


@pytest.mark.asyncio
async def test_smtp_failure_handling():
    """Verify that SMTP failure is handled gracefully without crashing the application."""
    with patch.object(settings, "SMTP_USER", "user"):
        with patch.object(settings, "SMTP_PASS", "pass"):
            with patch("aiosmtplib.send", side_effect=aiosmtplib.SMTPException("Connection timed out")):
                success = await send_verification_email("fail@example.com", "token-err")
                assert success is False
