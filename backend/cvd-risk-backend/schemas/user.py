from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=3)
    role: Optional[str] = "patient"

    @field_validator('password')
    def validate_password(cls, v):
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        special_chars = set('@$!%*?&')
        if not any(char in special_chars for char in v):
            raise ValueError('Password must contain at least one special character (@$!%*?&)')
        return v

    @field_validator('email')
    def validate_email_domain(cls, v):
        if "@example.com" in v:
            raise ValueError("Email addresses from example.com are not allowed.")
        return v

class UserLogin(UserBase):
    email: EmailStr
    password: str

class UserPublic(UserBase):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str