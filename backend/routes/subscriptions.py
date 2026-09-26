from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session
from backend.auth import require_admin, get_current_user_id
from backend.routes.admin import get_db
from backend.models.subscriptions import SubscriptionSettings, AccountSubscription
from backend.models.users import User

router = APIRouter(tags=['Subscriptions'])
Currency = Literal['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX']

class Settings(BaseModel):
    period: Literal['yearly', 'monthly'] = 'yearly'
    base_currency: Literal['RWF'] = 'RWF'
    standard: Decimal = Field(default=Decimal(20), gt=0, le=1000000000, decimal_places=2)
    premium: Decimal = Field(default=Decimal(100), gt=0, le=1000000000, decimal_places=2)
    # RWF per one unit; reference snapshot retrieved 2026-09-26 from bankfxapi.com/bank/27.
    rates: dict[Currency, Decimal] = {'RWF': Decimal(1), 'USD': Decimal('1478.35'), 'EUR': Decimal('1681.22505'), 'KES': Decimal('11.422571'), 'TZS': Decimal('0.55893'), 'UGX': Decimal('0.376316')}
    rates_note: str = Field(default='Reference snapshot: USD 2026-09-23; other currencies 2026-09-25. Admin-maintained, not live rates.', max_length=300)
    momo_number: str = Field(default='0786854200', pattern=r'^\+?[0-9]{9,15}$')

    @model_validator(mode='after')
    def valid_rates(self):
        if self.rates.get('RWF') != Decimal(1):
            raise ValueError('RWF conversion rate must be 1')
        if any(not rate.is_finite() or rate <= 0 or rate > 1000000 for rate in self.rates.values()):
            raise ValueError('Conversion rates must be positive and no more than 1000000')
        if self.premium < self.standard:
            raise ValueError('Premium must cost at least as much as Standard')
        if any(self.premium / rate >= Decimal('1000000000000') for rate in self.rates.values()):
            raise ValueError('Converted price is too large')
        return self

def catalogue(db):
    row = db.get(SubscriptionSettings, 1)
    settings = Settings(**row.config) if row else Settings()
    plans = []
    for currency, rate in settings.rates.items():
        for plan, amount in [('free', Decimal(0)), ('standard', settings.standard), ('premium', settings.premium)]:
            precision = Decimal('.0001') if currency != 'RWF' else Decimal('.01')
            plans.append({'plan': plan, 'currency': currency, 'amount': str((amount / rate).quantize(precision, rounding=ROUND_HALF_UP)), 'amount_rwf': str(amount)})
    return {'revision': row.revision if row else 1, 'settings': settings.model_dump(mode='json'), 'plans': plans,
            'period': settings.period, 'all_services_included': True, 'momo_number': settings.momo_number}

@router.get('/subscription-plans')
def list_prices(db: Session = Depends(get_db)):
    return catalogue(db)

@router.put('/admin/subscription-plans')
def update_prices(data: Settings, admin=Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(SubscriptionSettings).filter_by(id=1).with_for_update().first()
    if row is None:
        row = SubscriptionSettings(id=1, revision=2)
        db.add(row)
    else:
        row.revision += 1
    row.config = data.model_dump(mode='json')
    db.commit()
    return catalogue(db)

class Selection(BaseModel):
    plan: Literal['free', 'standard', 'premium']
    currency: Currency
    revision: int = Field(ge=1)
    accepted_terms: Literal[True]

def selected_subscription(selection, db):
    if selection is None:
        return None
    db.query(SubscriptionSettings).filter_by(id=1).with_for_update().first()
    data = catalogue(db)
    if selection.revision != data['revision']:
        raise HTTPException(409, 'Subscription prices changed. Reload and review the current prices.')
    quote = next((item for item in data['plans'] if item['plan'] == selection.plan and item['currency'] == selection.currency), None)
    if not quote:
        raise HTTPException(422, 'Choose an available subscription currency')
    return AccountSubscription(plan=quote['plan'], currency=quote['currency'], amount=quote['amount'], amount_rwf=quote['amount_rwf'], period=data['period'], payment_status='not_required' if selection.plan == 'free' else 'pending')

@router.get('/admin/subscriptions')
def list_subscriptions(admin=Depends(require_admin), db: Session = Depends(get_db)):
    return [{'user_id': user.user_id, 'full_name': user.full_name, 'email': user.email,
             'plan': sub.plan if sub else 'free', 'currency': sub.currency if sub else 'RWF',
             'amount': str(sub.amount) if sub else '0', 'amount_rwf': str(sub.amount_rwf) if sub else '0', 'period': sub.period if sub else 'yearly',
             'payment_required': bool(sub and sub.payment_required),
             'payment_status': sub.payment_status if sub else 'not_required'}
            for user, sub in db.query(User, AccountSubscription).outerjoin(AccountSubscription, User.user_id == AccountSubscription.user_id).filter(User.role != 'admin').all()]

class PaymentUpdate(BaseModel):
    status: Literal['pending', 'paid', 'waived']


def account_subscription(user_id, db):
    sub = db.get(AccountSubscription, user_id)
    if sub is None:
        return None
    return {'plan': sub.plan, 'currency': sub.currency, 'amount': str(sub.amount),
            'amount_rwf': str(sub.amount_rwf), 'period': sub.period,
            'payment_status': sub.payment_status, 'payment_required': sub.payment_required}


@router.put('/users/subscription')
def choose_subscription(data: Selection, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter_by(user_id=user_id).with_for_update().first()
    if not user or user.role == 'admin':
        raise HTTPException(403, 'This selection is for user accounts')
    if db.get(AccountSubscription, user_id) is not None:
        raise HTTPException(409, 'A subscription is already assigned. Contact admin to change it.')
    sub = selected_subscription(data, db)
    sub.user_id = user_id
    db.add(sub)
    db.commit()
    return account_subscription(user_id, db)

@router.patch('/admin/subscriptions/{user_id}')
def payment_status(user_id: int, data: PaymentUpdate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    sub = db.get(AccountSubscription, user_id)
    if not sub or sub.plan == 'free':
        raise HTTPException(404, 'No paid subscription selection found')
    if sub.payment_required and data.status == 'waived':
        raise HTTPException(422, 'This upgraded account requires confirmed payment')
    sub.payment_status = data.status
    db.commit()
    return {'payment_status': sub.payment_status}

class Upgrade(BaseModel):
    plan: Literal['standard', 'premium']
    period: Literal['monthly', 'yearly']
    revision: int

@router.post('/admin/subscriptions/{user_id}/upgrade')
def upgrade(user_id: int, data: Upgrade, admin=Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter_by(user_id=user_id).with_for_update().first()
    if not user or user.role == 'admin':
        raise HTTPException(403, 'Admin accounts cannot be upgraded')
    sub = db.get(AccountSubscription, user_id)
    ranks = {'free': 0, 'standard': 1, 'premium': 2}
    if ranks[data.plan] <= ranks[sub.plan if sub else 'free']:
        raise HTTPException(409, 'Select a higher subscription')
    prices = catalogue(db)
    if data.revision != prices['revision']:
        raise HTTPException(409, 'Prices changed. Reopen the upgrade form.')
    price = prices['settings'][data.plan]
    if sub is None:
        sub = AccountSubscription(user_id=user_id)
        db.add(sub)
    sub.plan, sub.period, sub.currency = data.plan, data.period, 'RWF'
    sub.amount = sub.amount_rwf = Decimal(price)
    sub.payment_status, sub.payment_required = 'pending', True
    db.commit()
    return {'message': 'Account upgraded. Access is blocked until admin confirms payment.'}
