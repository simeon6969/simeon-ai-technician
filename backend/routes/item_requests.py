from datetime import date
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend.auth import get_current_user_id
from backend.routes.spare_parts import get_db
from backend.models import User, SparePart, SaleItem
from backend.models.item_requests import ItemRequest
from backend.permissions import check_role

router = APIRouter(prefix='/item-requests', tags=['Item requests'])


class RequestInput(BaseModel):
    item_type: Literal['sale', 'spare_part']
    item_id: int = Field(gt=0)
    notes: str | None = Field(default=None, max_length=2000)


class StatusInput(BaseModel):
    status: Literal['pending', 'accepted', 'declined', 'fulfilled']


@router.post('/')
def request_item(data: RequestInput, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    item = db.get(SaleItem if data.item_type == 'sale' else SparePart, data.item_id)
    if not item or item.posted_at is None:
        raise HTTPException(404, 'Posted item not found')
    if data.item_type == 'sale' and item.medical_details:
        details = item.medical_details
        if details.get('quantity', 0) <= 0 or (details.get('expiry_date') and details['expiry_date'] < date.today().isoformat()):
            raise HTTPException(400, 'This medical item is out of stock or expired')
    seller_id = item.seller_id if data.item_type == 'sale' else item.submitted_by
    if seller_id == user_id:
        raise HTTPException(400, 'You cannot request your own item')
    if data.item_type == 'spare_part' and item.availability_status == 'unavailable':
        raise HTTPException(400, 'This spare part is currently unavailable')
    column = ItemRequest.sale_item_id if data.item_type == 'sale' else ItemRequest.spare_part_id
    query = db.query(ItemRequest).filter(ItemRequest.requester_id == user_id, column == data.item_id)
    existing = query.first()
    if existing:
        return {'request_id': existing.request_id, 'status': existing.status}
    record = ItemRequest(requester_id=user_id, seller_id=seller_id, notes=data.notes,
                         **{column.key: data.item_id})
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = query.first()
        if existing:
            return {'request_id': existing.request_id, 'status': existing.status}
        raise HTTPException(409, 'Item changed. Refresh and try again.')
    return {'request_id': record.request_id, 'status': record.status}


@router.get('/')
def list_requests(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    account = db.get(User, user_id)
    query = db.query(ItemRequest)
    if account.role == 'client':
        query = query.filter(ItemRequest.requester_id == user_id)
    elif account.role != 'admin':
        query = query.filter(or_(ItemRequest.requester_id == user_id, ItemRequest.seller_id == user_id))
    results = []
    for row in query.order_by(ItemRequest.created_at.desc()).all():
        item = db.get(SaleItem, row.sale_item_id) if row.sale_item_id else db.get(SparePart, row.spare_part_id)
        requester, seller = db.get(User, row.requester_id), db.get(User, row.seller_id)
        results.append({'request_id': row.request_id, 'item_name': (item.name if row.sale_item_id else item.part_name) if item else 'Deleted item',
            'requester_id': row.requester_id, 'requester_name': requester.full_name, 'requester_phone': requester.phone,
            **({'seller_id': row.seller_id, 'seller_name': seller.full_name, 'seller_phone': seller.phone} if account.role == 'admin' else {}),
            'account_field': seller.account_field, 'notes': row.notes, 'status': row.status,
            'created_at': row.created_at, 'can_manage': account.role == 'admin' or row.seller_id == user_id})
    return results


@router.patch('/{request_id}')
def update_request(request_id: int, data: StatusInput, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    check_role(db.get(User, user_id), {'technician', 'store'})
    row = db.get(ItemRequest, request_id)
    if not row:
        raise HTTPException(404, 'Request not found')
    if row.seller_id != user_id and db.get(User, user_id).role != 'admin':
        raise HTTPException(403, 'Only the seller can manage this request')
    row.status = data.status
    db.commit()
    return {'request_id': row.request_id, 'status': row.status}
