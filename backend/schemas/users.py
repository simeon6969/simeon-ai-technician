from backend.routes.subscriptions import Selection
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator


AccountField = Literal['medical', 'it', 'electrical', 'mechanical']
AccountRole = Literal['technician', 'store', 'client']


class AccountSetup(BaseModel):
    account_field: AccountField
    role: AccountRole


class UserCreate(AccountSetup):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    phone: str | None = None
    subscription: Selection | None = None
    password: str

    @field_validator('full_name')
    @classmethod
    def valid_name(cls, value):
        if not value.strip():
            raise ValueError('Account name is required')
        return value.strip()
