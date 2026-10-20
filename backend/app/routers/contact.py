from fastapi import APIRouter, BackgroundTasks, status
from app.schemas.contact import ContactRequest
from app.services.email import send_contact_inquiry_email

router = APIRouter()


@router.post("/contact", status_code=status.HTTP_200_OK)
async def submit_contact(payload: ContactRequest, background_tasks: BackgroundTasks):
    """
    Handle contact form submissions, dispatches notification email asynchronously.
    """
    background_tasks.add_task(send_contact_inquiry_email, payload.model_dump())
    return {
        "status": "ok",
        "message": "Thank you for reaching out! We have received your message and will reply within 24 hours.",
    }
