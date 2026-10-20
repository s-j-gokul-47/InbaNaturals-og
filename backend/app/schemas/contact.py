from pydantic import BaseModel, EmailStr, Field


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    subject: str = Field(default="General Inquiry", max_length=150)
    message: str = Field(..., min_length=5, max_length=3000)
