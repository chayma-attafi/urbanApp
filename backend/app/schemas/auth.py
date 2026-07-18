import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        errors = []
        if len(v) < 8:
            errors.append("au moins 8 caractères")
        if not re.search(r"[A-Z]", v):
            errors.append("au moins une majuscule")
        if not re.search(r"[a-z]", v):
            errors.append("au moins une minuscule")
        if not re.search(r"\d", v):
            errors.append("au moins un chiffre")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\[\]\\;'/`~]", v):
            errors.append("au moins un caractère spécial (!@#$%...)")
        if errors:
            raise ValueError("Mot de passe trop faible : " + ", ".join(errors))
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str]
    avatar_url: Optional[str]
    mobility_preference: str
    city: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    profile: Optional[ProfileResponse] = None

