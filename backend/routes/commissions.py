from datetime import datetime, timezone
from decimal import Decimal, ROUND_UP
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, aliased
from sqlalchemy.orm.exc import StaleDataError
from backend.auth import get_current_user_id
from backend.routes.spare_parts import get_db
from backend.models import User, SaleItem, SparePart, ItemRequest
from backend.models.commissions import CommissionSettings, CommissionAgreement, PaymentReviewNotification

router = APIRouter(tags=['Commission negotiations'])

def effective_settings(db):
    return db.get(CommissionSettings, 1) or CommissionSettings(id=1, enabled=True, payer='client', starting_percent=Decimal('5'), minimum_percent=Decimal('0'), reduction_percent=Decimal('0.2'), momo_number='0786854200')


class SettingsInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    enabled: bool
    payer: Literal['client', 'seller']
    starting_percent: Decimal = Field(gt=0, le=100, max_digits=5, decimal_places=2)
    minimum_percent: Decimal = Field(ge=0, le=100, max_digits=5, decimal_places=2)
    reduction_percent: Decimal = Field(gt=0, le=100, max_digits=5, decimal_places=2)
    momo_number: str = Field(pattern=r'^\+?[0-9]{9,15}$')

    @model_validator(mode='after')
    def limits(self):
        if self.minimum_percent > self.starting_percent:
            raise ValueError('Minimum percentage cannot exceed starting percentage')
        return self


class ActionInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    action: Literal['counter', 'accept', 'payment', 'approve', 'reject']
    revision: int = Field(ge=0)
    counter_percent: Decimal | None = Field(default=None, ge=0, le=100, max_digits=5, decimal_places=2)
    payment_reference: str | None = Field(default=None, min_length=3, max_length=200)
    note: str | None = Field(default=None, min_length=1, max_length=2000)


def admin_only(db, user_id):
    user = db.get(User, user_id)
    if not user or user.role != 'admin':
        raise HTTPException(403, 'Admin access required')


def allowed_request(db, request_id, user_id):
    row = db.get(ItemRequest, request_id)
    if not row:
        raise HTTPException(404, 'Request not found')
    admin = db.get(User, user_id).role == 'admin'
    if not admin and user_id not in (row.requester_id, row.seller_id):
        raise HTTPException(403, 'This request is private')
    return row, admin


def event(agreement, action, user_id, **details):
    agreement.history = [*(agreement.history or []), {'action': action, 'at': datetime.now(timezone.utc).isoformat(),
        'actor_id': user_id, 'percent': str(agreement.current_percent), **details}]


def view(agreement, row, user_id, admin, db):
    if not agreement:
        settings = effective_settings(db)
        return {'status': 'not_started', 'enabled': bool(settings and settings.enabled), 'request_id': row.request_id}
    payer_id = row.requester_id if agreement.payer == 'client' else row.seller_id
    quantum = Decimal('1') if agreement.currency in {'RWF', 'UGX'} else Decimal('0.01')
    amount = (agreement.listed_price * agreement.current_percent / 100).quantize(quantum, rounding=ROUND_UP)
    result = {'request_id': row.request_id, 'status': agreement.status, 'payer': agreement.payer,
        'is_payer': user_id == payer_id, 'listed_price': str(agreement.listed_price), 'currency': agreement.currency,
        'current_percent': str(agreement.current_percent), 'amount': str(amount), 'revision': agreement.revision,
        'momo_number': agreement.momo_number, 'review_note': agreement.review_note,
        'history': [{k: v for k, v in entry.items() if admin or k not in {'actor_id', 'reference'}} for entry in agreement.history],
        'approved_at': agreement.approved_at}
    if admin or user_id == payer_id:
        result['payment_reference'] = agreement.payment_reference
    if admin:
        result.update(minimum_percent=str(agreement.minimum_percent), reduction_percent=str(agreement.reduction_percent), approved_by=agreement.approved_by)
    if agreement.status == 'approved' and (admin or user_id == row.requester_id):
        seller = db.get(User, row.seller_id)
        result['seller'] = {'name': seller.full_name, 'phone': seller.phone, 'email': seller.email}
    return result


@router.get('/admin/commission-settings')
def settings(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    admin_only(db, user_id)
    row = effective_settings(db)
    return {key: getattr(row, key) for key in SettingsInput.model_fields}


@router.put('/admin/commission-settings')
def save_settings(data: SettingsInput, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    admin_only(db, user_id)
    row = db.get(CommissionSettings, 1)
    if row is None:
        row = CommissionSettings(id=1)
        db.add(row)
    for key, value in data.model_dump().items():
        setattr(row, key, value)
    db.commit()
    return data


@router.get('/item-requests/{request_id}/commission')
def get_commission(request_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    row, admin = allowed_request(db, request_id, user_id)
    return view(db.get(CommissionAgreement, request_id), row, user_id, admin, db)


@router.post('/item-requests/{request_id}/commission')
def start_commission(request_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    row, admin = allowed_request(db, request_id, user_id)
    agreement = db.get(CommissionAgreement, request_id)
    if agreement:
        return view(agreement, row, user_id, admin, db)
    config = effective_settings(db)
    if not config or not config.enabled:
        raise HTTPException(409, 'Commission negotiations are not configured by admin yet')
    item = db.get(SaleItem, row.sale_item_id) if row.sale_item_id else db.get(SparePart, row.spare_part_id)
    if row.status == 'declined' or not item or item.posted_at is None:
        raise HTTPException(409, 'This item request is no longer available')
    if item.price is None or item.price <= 0 or not item.currency:
        raise HTTPException(409, 'The item needs a listed price before negotiating a commission')
    agreement = CommissionAgreement(request_id=request_id, payer=config.payer, listed_price=item.price, currency=item.currency,
        starting_percent=config.starting_percent, current_percent=config.starting_percent,
        minimum_percent=config.minimum_percent, reduction_percent=config.reduction_percent, momo_number=config.momo_number)
    event(agreement, 'started', user_id)
    db.add(agreement)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        agreement = db.get(CommissionAgreement, request_id)
        if not agreement:
            raise HTTPException(409, 'Request changed. Please refresh.') from None
    return view(agreement, row, user_id, admin, db)


@router.post('/item-requests/{request_id}/commission/action')
def commission_action(request_id: int, data: ActionInput, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    row, admin = allowed_request(db, request_id, user_id)
    agreement = db.query(CommissionAgreement).filter_by(request_id=request_id).with_for_update().first()
    if not agreement:
        raise HTTPException(409, 'Start the negotiation first')
    if agreement.revision != data.revision:
        raise HTTPException(409, 'The negotiation changed. Refresh before continuing.')
    payer_id = row.requester_id if agreement.payer == 'client' else row.seller_id
    if data.action in {'approve', 'reject'}:
        if not admin:
            raise HTTPException(403, 'Only admin can confirm payment')
        if agreement.status != 'pending_review':
            raise HTTPException(409, 'Payment must be submitted before review')
        if data.action == 'approve':
            agreement.status = 'approved'
            agreement.approved_by = user_id
            agreement.approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
        else:
            if not data.note:
                raise HTTPException(422, 'Explain why the payment needs correction')
            agreement.status = 'negotiating' if agreement.current_percent == 0 else 'awaiting_payment'
        agreement.review_note = data.note
    else:
        if user_id != payer_id:
            raise HTTPException(403, 'Only the selected payer can negotiate or submit payment')
        if data.action in {'counter', 'accept'}:
            if agreement.status != 'negotiating':
                raise HTTPException(409, 'This offer is already accepted')
            if data.action == 'counter':
                if agreement.current_percent <= agreement.minimum_percent:
                    raise HTTPException(409, 'Simeon has reached the lowest permitted commission')
                if data.counter_percent is None or data.counter_percent >= agreement.current_percent:
                    raise HTTPException(422, 'Enter a counteroffer below the current percentage')
                agreement.current_percent = max(agreement.minimum_percent, agreement.current_percent - agreement.reduction_percent, data.counter_percent)
            else:
                agreement.status = 'pending_review' if agreement.current_percent == 0 else 'awaiting_payment'
        elif data.action == 'payment':
            if agreement.status != 'awaiting_payment' or not data.payment_reference:
                raise HTTPException(409, 'Accept the offer and provide a payment reference first')
            agreement.payment_reference = data.payment_reference
            agreement.review_note = None
            agreement.status = 'pending_review'
    event(agreement, data.action, user_id, **({'counter_percent': str(data.counter_percent)} if data.action == 'counter' else {}),
          **({'reference': data.payment_reference} if data.action == 'payment' else {}), **({'note': data.note} if data.note else {}))
    agreement.revision += 1
    if agreement.status == 'pending_review':
        db.add(PaymentReviewNotification(request_id=request_id, revision=agreement.revision))
    if data.action in {'approve', 'reject'}:
        db.query(PaymentReviewNotification).filter_by(request_id=request_id, resolved_at=None).update(
            {'resolved_at': datetime.now(timezone.utc).replace(tzinfo=None)}, synchronize_session=False)
    try:
        db.commit()
    except StaleDataError:
        db.rollback()
        raise HTTPException(409, 'The negotiation changed. Refresh before continuing.') from None
    return view(agreement, row, user_id, admin, db)


@router.get('/admin/payment-reviews')
def payment_reviews(offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
                    user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    admin_only(db, user_id)
    client, seller = aliased(User), aliased(User)
    query = db.query(PaymentReviewNotification, CommissionAgreement, SaleItem.name, SparePart.part_name,
                     client.full_name, seller.full_name).join(CommissionAgreement, CommissionAgreement.request_id == PaymentReviewNotification.request_id).join(
        ItemRequest, ItemRequest.request_id == CommissionAgreement.request_id).join(client, client.user_id == ItemRequest.requester_id).join(
        seller, seller.user_id == ItemRequest.seller_id).outerjoin(SaleItem, SaleItem.item_id == ItemRequest.sale_item_id).outerjoin(
        SparePart, SparePart.spare_part_id == ItemRequest.spare_part_id).filter(
        PaymentReviewNotification.resolved_at.is_(None), CommissionAgreement.status == 'pending_review')
    total = query.count()
    rows = query.order_by(PaymentReviewNotification.created_at, PaymentReviewNotification.notification_id).offset(offset).limit(limit).all()
    return {'total': total, 'items': [
        {'notification_id': notice.notification_id, 'request_id': notice.request_id, 'revision': notice.revision,
         'submitted_at': notice.created_at.isoformat() + 'Z', 'item_name': name or part_name or 'Deleted item',
         'payer': agreement.payer, 'payer_name': client_name if agreement.payer == 'client' else seller_name,
         'current_percent': str(agreement.current_percent), 'currency': agreement.currency,
         'amount': str((agreement.listed_price * agreement.current_percent / 100).quantize(
             Decimal('1') if agreement.currency in {'RWF', 'UGX'} else Decimal('0.01'), rounding=ROUND_UP)),
         'payment_reference': agreement.payment_reference}
        for notice, agreement, name, part_name, client_name, seller_name in rows]}


@router.get('/my/commission-approvals')
def my_approvals(offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=50),
                 user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    query = db.query(CommissionAgreement.request_id, CommissionAgreement.approved_at, SaleItem.name, SparePart.part_name).join(
        ItemRequest, ItemRequest.request_id == CommissionAgreement.request_id).outerjoin(
        SaleItem, SaleItem.item_id == ItemRequest.sale_item_id).outerjoin(
        SparePart, SparePart.spare_part_id == ItemRequest.spare_part_id).filter(
        ItemRequest.requester_id == user_id, CommissionAgreement.status == 'approved')
    return {'total': query.count(), 'items': [
        {'request_id': row.request_id, 'item_name': row.name or row.part_name or 'Deleted item',
         'approved_at': row.approved_at.isoformat() + 'Z' if row.approved_at else None}
        for row in query.order_by(CommissionAgreement.approved_at.desc(), CommissionAgreement.request_id.desc()).offset(offset).limit(limit).all()]}
