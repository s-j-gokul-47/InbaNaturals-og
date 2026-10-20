import logging
from email.message import EmailMessage
from typing import Any, Dict, List, Optional
import aiosmtplib

from app.config import settings

logger = logging.getLogger("uvicorn.error")


def _get_from_header() -> str:
    """Return the formatted sender email header."""
    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER or "noreply@inbanaturals.com"
    if settings.SMTP_FROM_NAME:
        return f"{settings.SMTP_FROM_NAME} <{from_email}>"
    return from_email


async def _send_smtp_message(msg: EmailMessage, to_email: str, subject: str) -> bool:
    """
    Internal helper to send an EmailMessage using aiosmtplib.
    Falls back to mock logging if SMTP credentials are not configured.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASS:
        logger.info(
            f"\n========================================\n"
            f"MOCK EMAIL (SMTP credentials not set)\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"From: {_get_from_header()}\n"
            f"Body preview:\n{msg.get_body(preferencelist=('plain', 'html')).get_content()[:250]}...\n"
            f"========================================\n"
        )
        return True

    try:
        use_tls = bool(settings.SMTP_SSL)
        start_tls = bool(settings.SMTP_TLS) and not use_tls

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASS,
            use_tls=use_tls,
            start_tls=start_tls,
            timeout=15.0,
        )
        logger.info(f"Email '{subject}' successfully sent to {to_email}")
        return True
    except aiosmtplib.SMTPException as smtp_err:
        logger.error(f"SMTP error sending email '{subject}' to {to_email}: {smtp_err}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending email '{subject}' to {to_email}: {e}")
        return False


async def send_verification_email(to_email: str, token: str, full_name: Optional[str] = None) -> bool:
    """
    Send user registration verification email with token link.
    """
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    greeting = f"Hello {full_name}," if full_name else "Welcome to InbaNaturals!"
    subject = "Verify your InbaNaturals account"

    text_content = (
        f"{greeting}\n\n"
        f"Thank you for joining InbaNaturals — Pure Botanical Care.\n\n"
        f"Please verify your email address by opening the following link:\n"
        f"{verify_url}\n\n"
        f"This verification link will expire in 24 hours.\n\n"
        f"If you did not register for an InbaNaturals account, please ignore this email.\n\n"
        f"With love,\n"
        f"The InbaNaturals Team\n"
    )

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FDFBF7; color: #2B2625; margin: 0; padding: 24px; }}
    .card {{ max-width: 540px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EAE5DE; border-radius: 16px; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }}
    .brand {{ color: #4F6D55; font-size: 24px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.5px; text-align: center; }}
    .tagline {{ color: #7F7776; font-size: 13px; text-align: center; margin-bottom: 28px; text-transform: uppercase; letter-spacing: 1px; }}
    h2 {{ font-size: 20px; font-weight: 600; color: #2B2625; margin-top: 0; }}
    p {{ font-size: 15px; line-height: 1.6; color: #524B4A; }}
    .btn-container {{ text-align: center; margin: 32px 0; }}
    .btn {{ background-color: #4F6D55; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 600; font-size: 15px; display: inline-block; }}
    .footer {{ font-size: 12px; color: #9A9493; text-align: center; margin-top: 32px; border-top: 1px solid #F0ECE6; padding-top: 20px; }}
    .link-alt {{ font-size: 12px; word-break: break-all; color: #7F7776; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">🌿 InbaNaturals</div>
    <div class="tagline">100% Pure Botanical Care</div>
    <h2>{greeting}</h2>
    <p>Thank you for creating an account with InbaNaturals. Please verify your email address to activate your account and start exploring our botanical hair and skincare products.</p>
    <div class="btn-container">
      <a href="{verify_url}" class="btn" target="_blank">Verify Email Address</a>
    </div>
    <p class="link-alt">If the button above does not work, copy and paste this link into your browser:<br><a href="{verify_url}">{verify_url}</a></p>
    <p>This link is valid for 24 hours. If you did not create this account, you can safely ignore this message.</p>
    <div class="footer">
      &copy; InbaNaturals. Handcrafted botanical beauty free from harmful chemicals.
    </div>
  </div>
</body>
</html>"""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = _get_from_header()
    msg["To"] = to_email
    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype="html")

    return await _send_smtp_message(msg, to_email, subject)


async def send_order_confirmation_email(to_email: str, order_data: Dict[str, Any]) -> bool:
    """
    Send order confirmation email with itemized invoice and delivery details.
    """
    order_number = order_data.get("order_number", "N/A")
    items: List[Dict[str, Any]] = order_data.get("items", [])
    total = order_data.get("total", 0)
    subtotal = order_data.get("subtotal", total)
    discount = order_data.get("discount", 0)
    shipping_name = order_data.get("shipping_name", "Valued Customer")
    shipping_address = order_data.get("shipping_address", "Provided on file")
    shipping_phone = order_data.get("shipping_phone", "")

    subject = f"Order Confirmed: #{order_number} — InbaNaturals"

    # Plain text version
    items_text = ""
    for item in items:
        p_name = item.get("product_name", "Product")
        size = f" ({item.get('size')})" if item.get("size") else ""
        qty = item.get("quantity", 1)
        price = item.get("unit_price", 0)
        items_text += f" - {p_name}{size} x {qty} = Rs. {price * qty}\n"

    text_content = (
        f"Hello {shipping_name},\n\n"
        f"Thank you for your order with InbaNaturals! We've received your order #{order_number} and it is now confirmed.\n\n"
        f"Order Summary:\n"
        f"{items_text}\n"
        f"Subtotal: Rs. {subtotal}\n"
        f"Discount: Rs. {discount}\n"
        f"Total Paid: Rs. {total}\n\n"
        f"Shipping Details:\n"
        f"Name: {shipping_name}\n"
        f"Address: {shipping_address}\n"
        f"Phone: {shipping_phone}\n\n"
        f"We will carefully prepare and pack your botanical products. If you have any questions, reply to this email.\n\n"
        f"With love,\n"
        f"The InbaNaturals Team\n"
    )

    # HTML table rows for items
    items_html = ""
    for item in items:
        p_name = item.get("product_name", "Product")
        size_badge = f'<span style="color:#7F7776; font-size:12px;"> ({item.get("size")})</span>' if item.get("size") else ""
        qty = item.get("quantity", 1)
        price = item.get("unit_price", 0)
        item_total = price * qty
        items_html += f"""
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0ECE6; font-size: 14px; color: #2B2625;">
            <strong>{p_name}</strong>{size_badge}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0ECE6; font-size: 14px; color: #524B4A; text-align: center;">
            {qty}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0ECE6; font-size: 14px; color: #2B2625; text-align: right;">
            ₹{item_total}
          </td>
        </tr>
        """

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FDFBF7; color: #2B2625; margin: 0; padding: 24px; }}
    .card {{ max-width: 580px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EAE5DE; border-radius: 16px; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }}
    .brand {{ color: #4F6D55; font-size: 24px; font-weight: 700; margin-bottom: 4px; text-align: center; }}
    .tagline {{ color: #7F7776; font-size: 12px; text-align: center; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; }}
    .status-badge {{ background-color: #E8F0EA; color: #2F5938; font-weight: 600; font-size: 13px; padding: 6px 14px; border-radius: 999px; display: inline-block; margin-bottom: 16px; }}
    h2 {{ font-size: 20px; font-weight: 600; color: #2B2625; margin: 12px 0 6px 0; }}
    p {{ font-size: 14px; line-height: 1.5; color: #524B4A; }}
    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
    th {{ text-align: left; font-size: 12px; text-transform: uppercase; color: #7F7776; letter-spacing: 0.5px; padding-bottom: 8px; border-bottom: 2px solid #EAE5DE; }}
    .total-row td {{ padding: 6px 0; font-size: 14px; color: #524B4A; }}
    .grand-total td {{ padding: 12px 0 6px 0; font-size: 16px; font-weight: 700; color: #2B2625; border-top: 2px solid #2B2625; }}
    .address-box {{ background: #FDFBF7; border: 1px solid #EAE5DE; border-radius: 12px; padding: 16px; margin: 24px 0 16px 0; }}
    .footer {{ font-size: 12px; color: #9A9493; text-align: center; margin-top: 28px; border-top: 1px solid #F0ECE6; padding-top: 18px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">🌿 InbaNaturals</div>
    <div class="tagline">Order Confirmation</div>
    
    <div style="text-align: center;">
      <span class="status-badge">✓ Order Confirmed</span>
      <h2>Thank You, {shipping_name}!</h2>
      <p>We've received your order <strong>#{order_number}</strong> and are preparing it with care.</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        {items_html}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="2" style="text-align: right; padding-right: 12px;">Subtotal:</td>
          <td style="text-align: right;">₹{subtotal}</td>
        </tr>
        {f'<tr class="total-row"><td colspan="2" style="text-align: right; padding-right: 12px; color: #4F6D55;">Discount:</td><td style="text-align: right; color: #4F6D55;">-₹{discount}</td></tr>' if discount else ''}
        <tr class="grand-total">
          <td colspan="2" style="text-align: right; padding-right: 12px;">Total Paid:</td>
          <td style="text-align: right;">₹{total}</td>
        </tr>
      </tfoot>
    </table>

    <div class="address-box">
      <div style="font-weight: 600; font-size: 13px; text-transform: uppercase; color: #4F6D55; margin-bottom: 6px;">Shipping Address</div>
      <div style="font-size: 14px; color: #2B2625; font-weight: 500;">{shipping_name}</div>
      <div style="font-size: 13px; color: #524B4A; margin-top: 2px;">{shipping_address}</div>
      {f'<div style="font-size: 13px; color: #7F7776; margin-top: 4px;">Phone: {shipping_phone}</div>' if shipping_phone else ''}
    </div>

    <p style="font-size: 13px; color: #7F7776; text-align: center;">Have questions about your order? Reply directly to this email or reach us on WhatsApp.</p>

    <div class="footer">
      &copy; InbaNaturals. Handcrafted botanical beauty from pure ingredients.
    </div>
  </div>
</body>
</html>"""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = _get_from_header()
    msg["To"] = to_email
    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype="html")

    return await _send_smtp_message(msg, to_email, subject)


async def send_contact_inquiry_email(contact_data: Dict[str, Any]) -> bool:
    """
    Send incoming contact form inquiry notification to store administration.
    """
    name = contact_data.get("name", "Website Visitor")
    sender_email = contact_data.get("email", "unknown@example.com")
    subject = contact_data.get("subject", "General Inquiry")
    message = contact_data.get("message", "")

    admin_recipient = settings.SMTP_FROM_EMAIL or settings.SMTP_USER or "hello@inbanaturals.com"
    email_subject = f"New Inquiry: {subject} — from {name}"

    text_content = (
        f"You have received a new contact form message on InbaNaturals:\n\n"
        f"Name: {name}\n"
        f"Email: {sender_email}\n"
        f"Subject: {subject}\n\n"
        f"Message:\n{message}\n\n"
        f"Reply directly to this email to contact {name} at {sender_email}.\n"
    )

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2B2625; padding: 24px; }}
    .card {{ max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EAE5DE; border-radius: 16px; padding: 32px; }}
    .badge {{ background-color: #E8F0EA; color: #2F5938; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; display: inline-block; }}
    h2 {{ font-size: 20px; color: #2B2625; margin: 12px 0 16px 0; }}
    .field {{ margin-bottom: 12px; font-size: 14px; }}
    .field strong {{ color: #4F6D55; display: inline-block; width: 80px; }}
    .msg-box {{ background: #FDFBF7; border: 1px solid #EAE5DE; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #2B2625; white-space: pre-wrap; }}
    .footer {{ font-size: 12px; color: #9A9493; border-top: 1px solid #F0ECE6; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">InbaNaturals Contact Form</span>
    <h2>Customer Message Received</h2>
    <div class="field"><strong>From:</strong> {name}</div>
    <div class="field"><strong>Email:</strong> <a href="mailto:{sender_email}">{sender_email}</a></div>
    <div class="field"><strong>Subject:</strong> {subject}</div>
    <div class="msg-box">{message}</div>
    <div class="footer">
      Hit reply to respond directly to the customer at {sender_email}.
    </div>
  </div>
</body>
</html>"""

    msg = EmailMessage()
    msg["Subject"] = email_subject
    msg["From"] = _get_from_header()
    msg["To"] = admin_recipient
    msg["Reply-To"] = f"{name} <{sender_email}>"
    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype="html")

    return await _send_smtp_message(msg, admin_recipient, email_subject)

