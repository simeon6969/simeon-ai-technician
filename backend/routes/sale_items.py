from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, ConfigDict, field_validator
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.auth import get_current_user_id
from backend.routes.spare_parts import get_db
from backend.models.sale_items import SaleItem
from backend.models.users import User
from backend.schemas.spare_parts import validate_photo_data

router = APIRouter(prefix='/sale-items', tags=['Items for sale'])


class SaleItemCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=12000)
    price: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    currency: Literal['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX'] = 'RWF'
    photo_data: str = Field(min_length=1, max_length=7000000)
    _photo = field_validator('photo_data')(validate_photo_data)


def serialize(item):
    return {field: getattr(item, field) for field in (
        'item_id', 'seller_id', 'name', 'description', 'price', 'currency',
        'photo_data', 'posted_at', 'created_at')}


@router.post('/')
def create_item(data: SaleItemCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    item = SaleItem(seller_id=user_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize(item)


@router.get('/my')
def my_items(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return [serialize(item) for item in db.query(SaleItem).filter(SaleItem.seller_id == user_id).order_by(SaleItem.item_id.desc()).all()]


@router.get('/public')
def public_posts(
    offset: int = Query(0, ge=0), limit: int = Query(12, ge=1, le=24),
    search: str = Query('', max_length=200), db: Session = Depends(get_db),
):
    query = db.query(SaleItem, User.full_name).join(User, User.user_id == SaleItem.seller_id).filter(SaleItem.posted_at.is_not(None))
    if search.strip():
        query = query.filter(or_(SaleItem.name.icontains(search.strip(), autoescape=True), SaleItem.description.icontains(search.strip(), autoescape=True)))
    return {'total': query.count(), 'items': [
        {'item_id': item.item_id, 'name': item.name, 'description': item.description,
         'price': item.price, 'currency': item.currency, 'photo_data': item.photo_data,
         'posted_at': item.posted_at, 'seller_name': name}
        for item, name in query.order_by(SaleItem.posted_at.desc(), SaleItem.item_id.desc()).offset(offset).limit(limit).all()
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
def publish(item_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    item = owned_item(item_id, user_id, db)
    db.query(SaleItem).filter(SaleItem.item_id == item_id, SaleItem.posted_at.is_(None)).update({'posted_at': datetime.now(timezone.utc).replace(tzinfo=None)}, synchronize_session=False)
    db.commit()
    db.refresh(item)
    return serialize(item)


@router.delete('/{item_id}')
def delete_item(item_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    db.delete(owned_item(item_id, user_id, db))
    db.commit()
    return {'item_id': item_id}
