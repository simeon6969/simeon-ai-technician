from datetime import datetime
from decimal import Decimal
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.auth import require_admin
from backend.routes.admin import get_db
from backend.models import User, JobCard, SparePart, SaleItem, MaintenanceKnowledge, SparePartRequest, ItemRequest
from backend.schemas.users import AccountField, AccountRole
from backend.schemas.spare_parts import validate_photo_data
from backend.routes.job_cards import validate_job_card

router = APIRouter(prefix='/admin', tags=['Administration'])


class AccountEdit(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    role: AccountRole
    account_field: AccountField

    @field_validator('full_name')
    @classmethod
    def name(cls, value):
        if not value.strip():
            raise ValueError('Account name is required')
        return value.strip()


class PartEdit(BaseModel):
    part_name: str = Field(min_length=1, max_length=200)
    part_number: str | None = Field(default=None, max_length=150)
    manufacturer: str | None = Field(default=None, max_length=150)
    description: str | None = None
    specifications: str | None = None
    compatibility: str | None = None
    price: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    currency: Literal['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX'] = 'RWF'
    availability_status: Literal['available', 'limited', 'unavailable', 'unknown'] = 'available'
    photo_data: str | None = None
    _photo = field_validator('photo_data')(validate_photo_data)


class SaleEdit(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    price: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    currency: Literal['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX'] = 'RWF'
    photo_data: str
    _photo = field_validator('photo_data')(validate_photo_data)


class CardEdit(BaseModel):
    fault_description: str = Field(min_length=1)
    symptoms: str | None = None
    diagnosis: str | None = None
    actions_taken: str | None = None
    parts_used: str | None = None
    result: str | None = None
    successful: bool = False


class PublicationEdit(BaseModel):
    published: bool


def record(db, model, record_id):
    value = db.get(model, record_id)
    if not value:
        raise HTTPException(404, 'Record not found')
    return value


def save(db, value, data):
    for key, content in data.model_dump().items():
        setattr(value, key, content)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'This change conflicts with existing records. Check the email or related records.')
    return {'saved': True}


@router.patch('/users/{user_id}')
def edit_account(user_id: int, data: AccountEdit, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    user = record(db, User, user_id)
    if user.role == 'admin':
        raise HTTPException(403, 'Admin accounts are protected')
    return save(db, user, data)


@router.patch('/spare-parts/{part_id}')
def edit_part(part_id: int, data: PartEdit, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    return save(db, record(db, SparePart, part_id), data)


@router.patch('/sale-items/{item_id}')
def edit_sale(item_id: int, data: SaleEdit, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    return save(db, record(db, SaleItem, item_id), data)


@router.patch('/job-cards/{card_id}')
def edit_card(card_id: int, data: CardEdit, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    card = record(db, JobCard, card_id)
    # Edited evidence must be reviewed again, never left marked as validated.
    db.query(MaintenanceKnowledge).filter(MaintenanceKnowledge.source_job_card_id == card_id).delete(synchronize_session=False)
    card.status = 'submitted'
    card.confirmed_at = None
    card.updated_at = datetime.now()
    return save(db, card, data)


@router.post('/job-cards/{card_id}/validate')
def confirm_card(card_id: int, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    card = record(db, JobCard, card_id)
    return validate_job_card(card_id, user_id=card.technician_id, db=db)


@router.patch('/{collection}/{record_id}/publication')
def publication(collection: Literal['spare-parts', 'sale-items'], record_id: int, data: PublicationEdit,
                admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    item = record(db, SparePart if collection == 'spare-parts' else SaleItem, record_id)
    item.posted_at = (item.posted_at or datetime.now()) if data.published else None
    db.commit()
    return {'published': item.posted_at is not None}


@router.delete('/item-requests/{request_id}')
def delete_item_request(request_id: int, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    db.delete(record(db, ItemRequest, request_id)); db.commit()
    return {'deleted': True}


@router.delete('/spare-part-requests/{request_id}')
def delete_legacy_request(request_id: int, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    db.delete(record(db, SparePartRequest, request_id)); db.commit()
    return {'deleted': True}
