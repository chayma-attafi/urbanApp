from typing import Optional

from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    mobility_preference: Optional[str] = None
    city: Optional[str] = None

