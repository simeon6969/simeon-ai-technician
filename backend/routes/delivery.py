import re
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from backend.auth import require_admin
from backend.routes.admin import get_db
from backend.models.delivery import DeliveryContact

router = APIRouter(tags=['Delivery'])


class Contacts(BaseModel):
    phone: str = ''
    whatsapp: str = ''
    email: EmailStr | None = None

    @field_validator('phone', 'whatsapp')
    @classmethod
    def phone_number(cls, value):
        value = value.strip()
        if value and not re.fullmatch(r'\+[1-9]\d{6,14}', value):
            raise ValueError('Use international format, for example +250786854200')
        return value

    @field_validator('email', mode='before')
    @classmethod
    def empty_email(cls, value):
        return value.strip() or None if isinstance(value, str) else value


@router.get('/delivery-contacts', response_model=Contacts)
def get_contacts(db: Session = Depends(get_db)):
    row = db.get(DeliveryContact, 1)
    return Contacts(phone=row.phone, whatsapp=row.whatsapp, email=row.email) if row else Contacts()


@router.put('/admin/delivery-contacts', response_model=Contacts)
def save_contacts(payload: Contacts, admin=Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(DeliveryContact, 1)
    if row is None:
        row = DeliveryContact(id=1)
        db.add(row)
    row.phone, row.whatsapp, row.email = payload.phone, payload.whatsapp, str(payload.email or '')
    db.commit()
    return payload
