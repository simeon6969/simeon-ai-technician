from backend.permissions import require_inventory
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, ConfigDict, field_validator
from sqlalchemy.orm import Session
from sqlalchemy import or_, literal, String, cast
from backend.models.spare_parts import SparePart
from backend.auth import get_current_user_id
from backend.routes.spare_parts import get_db
from backend.models.sale_items import SaleItem
from backend.models.users import User
from backend.schemas.spare_parts import validate_photo_data

router = APIRouter(prefix='/sale-items', tags=['Items for sale'])


class MedicalDetails(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    quantity: int = Field(ge=0, le=1000000000)
    unit: str = Field(min_length=1, max_length=60)
    manufacturer: str = Field(default='', max_length=150)
    batch_number: str = Field(default='', max_length=100)
    expiry_date: date | None = None
    storage_location: str = Field(default='', max_length=200)
    storage_conditions: str = Field(default='', max_length=500)
    model: str = Field(default='', max_length=150)
    serial_number: str = Field(default='', max_length=150)
    condition: str = Field(default='', max_length=100)
    next_service_date: date | None = None
    generic_name: str = Field(default='', max_length=200)
    strength: str = Field(default='', max_length=100)
    dosage_form: str = Field(default='', max_length=100)
    record_version: int = Field(default=1, ge=1, le=2)
    route: str = Field(default='', max_length=100)
    pack_size: str = Field(default='', max_length=100)
    prescription_status: str = Field(default='', max_length=100)
    manufacture_date: date | None = None
    supplier: str = Field(default='', max_length=100)
    received_date: date | None = None
    reorder_level: int | None = Field(default=None, ge=0, le=1000000000)
    product_code: str = Field(default='', max_length=100)
    size_specification: str = Field(default='', max_length=100)
    material: str = Field(default='', max_length=100)
    sterility: str = Field(default='', max_length=100)
    single_use: str = Field(default='', max_length=100)
    equipment_type: str = Field(default='', max_length=100)
    asset_tag: str = Field(default='', max_length=100)
    power_requirements: str = Field(default='', max_length=100)
    accessories: str = Field(default='', max_length=2000)
    last_service_date: date | None = None
    calibration_due_date: date | None = None
    warranty_end: date | None = None


def validate_medical_record(category, details):
    if details.record_version < 2:
        return
    required = {
        'pharmacy': ['generic_name', 'strength', 'dosage_form', 'pack_size', 'manufacturer', 'batch_number', 'expiry_date', 'storage_conditions'],
        'consumables': ['size_specification', 'sterility', 'single_use', 'pack_size', 'manufacturer', 'batch_number'],
        'biomedical': ['equipment_type', 'manufacturer', 'model', 'condition'],
    }
    if any(not getattr(details, key) for key in required[category]):
        raise HTTPException(422, 'Complete the required details for this medical category')
    if details.manufacture_date and details.expiry_date and details.expiry_date < details.manufacture_date:
        raise HTTPException(422, 'Expiry date cannot be before manufacture date')


class SaleItemCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=12000)
    price: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    currency: Literal['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX'] = 'RWF'
    photo_data: str = Field(min_length=1, max_length=7000000)
    medical_category: Literal['consumables', 'biomedical', 'pharmacy'] | None = None
    medical_details: MedicalDetails | None = None
    _photo = field_validator('photo_data')(validate_photo_data)


def serialize(item):
    return {field: getattr(item, field) for field in (
        'item_id', 'seller_id', 'name', 'description', 'price', 'currency',
        'photo_data', 'posted_at', 'created_at', 'medical_category', 'medical_details')}


@router.post('/')
def create_item(data: SaleItemCreate, user_id: int = Depends(require_inventory), db: Session = Depends(get_db)):
    if data.medical_category or data.medical_details:
        user = db.get(User, user_id)
        if not user or user.role != 'store' or user.account_field != 'medical':
            raise HTTPException(403, 'Medical inventory is available to Medical store accounts')
        if not data.medical_category or not data.medical_details:
            raise HTTPException(422, 'Choose a medical category and enter stock details')
        validate_medical_record(data.medical_category, data.medical_details)
    values = data.model_dump()
    if data.medical_details:
        values['medical_details'] = data.medical_details.model_dump(mode='json')
    item = SaleItem(seller_id=user_id, **values)
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize(item)


@router.get('/my')
def my_items(user_id: int = Depends(require_inventory), db: Session = Depends(get_db)):
    return [serialize(item) for item in db.query(SaleItem).filter(SaleItem.seller_id == user_id).order_by(SaleItem.item_id.desc()).all()]


@router.get('/public')
def public_posts(
    offset: int = Query(0, ge=0), limit: int = Query(12, ge=1, le=24),
    search: str = Query('', max_length=200), account_field: str | None = Query(None, pattern='^(medical|it|electrical|mechanical)$'), db: Session = Depends(get_db),
):
    sales = db.query(
        SaleItem.item_id.label('item_id'), SaleItem.name.label('name'),
        SaleItem.description.label('description'), SaleItem.price.label('price'),
        SaleItem.currency.label('currency'), SaleItem.photo_data.label('photo_data'),
        SaleItem.posted_at.label('posted_at'), User.full_name.label('seller_name'), User.account_field.label('account_field'),
        literal('sale').label('item_type'), cast(literal(None), String).label('availability_status'),
    ).join(User, User.user_id == SaleItem.seller_id).filter(SaleItem.posted_at.is_not(None))
    parts = db.query(
        SparePart.spare_part_id, SparePart.part_name, SparePart.description,
        SparePart.price, SparePart.currency,
        SparePart.photo_data, SparePart.posted_at, User.full_name, User.account_field,
        literal('spare_part'), SparePart.availability_status,
    ).join(User, User.user_id == SparePart.submitted_by).filter(SparePart.posted_at.is_not(None))
    listings = sales.union_all(parts).subquery()
    query = db.query(listings)
    if account_field:
        query = query.filter(listings.c.account_field == account_field)
    if search.strip():
        query = query.filter(or_(listings.c.name.icontains(search.strip(), autoescape=True), listings.c.description.icontains(search.strip(), autoescape=True)))
    return {'total': query.count(), 'items': [
        {**dict(row._mapping), 'listing_key': f'{row.item_type}-{row.item_id}'}
        for row in query.order_by(listings.c.posted_at.desc(), listings.c.item_type, listings.c.item_id.desc()).offset(offset).limit(limit).all()
    ]}


@router.get('/posts')
def posts(offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=50), user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    query = db.query(SaleItem, User.full_name).join(User, User.user_id == SaleItem.seller_id).filter(SaleItem.posted_at.is_not(None))
    return {'total': query.count(), 'items': [
        {**serialize(item), 'seller_name': name} for item, name in query.order_by(SaleItem.posted_at.desc(), SaleItem.item_id.desc()).offset(offset).limit(limit).all()
    ]}


def owned_item(item_id, user_id, db):
    item = db.query(SaleItem).filter(SaleItem.item_id == item_id, SaleItem.seller_id == user_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail='Item not found')
    return item


@router.post('/{item_id}/post')
def publish(item_id: int, user_id: int = Depends(require_inventory), db: Session = Depends(get_db)):
    item = owned_item(item_id, user_id, db)
    db.query(SaleItem).filter(SaleItem.item_id == item_id, SaleItem.posted_at.is_(None)).update({'posted_at': datetime.now(timezone.utc).replace(tzinfo=None)}, synchronize_session=False)
    db.commit()
    db.refresh(item)
    return serialize(item)


@router.delete('/{item_id}')
def delete_item(item_id: int, user_id: int = Depends(require_inventory), db: Session = Depends(get_db)):
    db.delete(owned_item(item_id, user_id, db))
    db.commit()
    return {'item_id': item_id}


@router.patch('/{item_id}/medical-stock')
def update_medical_stock(item_id: int, data: MedicalDetails, user_id: int = Depends(require_inventory), db: Session = Depends(get_db)):
    item = owned_item(item_id, user_id, db)
    if not item.medical_category:
        raise HTTPException(422, 'This item has no medical stock category')
    if (item.medical_details or {}).get('record_version', 1) >= 2:
        data.record_version = 2
    validate_medical_record(item.medical_category, data)
    item.medical_details = data.model_dump(mode='json')
    db.commit()
    return serialize(item)
