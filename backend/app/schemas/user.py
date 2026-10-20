from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


SPECIAL_CHARACTERS = set("!@#$%^&*()_+-=[]{}|;:,.<>/?~`'\"\\")


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str = ""

    @field_validator("username")
    @classmethod
    def username_min_length(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(clean) > 50:
            raise ValueError("Username must not exceed 50 characters")
        return clean

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        if not any(char.isupper() for char in v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z)")
        if not any(char.islower() for char in v):
            raise ValueError("Password must contain at least one lowercase letter (a-z)")
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one number (0-9)")
        if not any(char in SPECIAL_CHARACTERS for char in v):
            raise ValueError(
                "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>/?~)"
            )
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    wallet_balance: int
    is_verified: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    message: str
