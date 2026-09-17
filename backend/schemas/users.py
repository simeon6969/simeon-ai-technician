from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    role: Literal['technician', 'organization', 'institution', 'health_facility', 'other_business'] = 'technician'
    email: EmailStr
    phone: str | None = None
    password: str

    @field_validator('full_name')
    @classmethod
    def valid_name(cls, value):
        if not value.strip():
            raise ValueError('Account name is required')
        return value.strip()
