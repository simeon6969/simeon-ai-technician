from fastapi import HTTPException
from backend.models.subscriptions import AccountSubscription, SubscriptionSettings


def check_subscription(user, db):
    if user.role == 'admin':
        return
    sub = db.get(AccountSubscription, user.user_id)
    if sub and sub.payment_required and sub.payment_status != 'paid':
        settings = db.get(SubscriptionSettings, 1)
        number = settings.config.get('momo_number', '0786854200') if settings else '0786854200'
        raise HTTPException(402, f'Payment required: {sub.amount_rwf} RWF for {sub.plan} ({sub.period}). Pay by MoMo to {number}. Your account will reopen after admin confirms payment.')
