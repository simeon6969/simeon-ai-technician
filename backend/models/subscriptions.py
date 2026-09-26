from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, JSON, Boolean
from backend.base import Base
from datetime import datetime


class SubscriptionSettings(Base):
    __tablename__ = 'subscription_settings'
    id = Column(Integer, primary_key=True)
    config = Column(JSON, nullable=False)
    revision = Column(Integer, nullable=False, default=1)


class AccountSubscription(Base):
    __tablename__ = 'account_subscriptions'
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), primary_key=True)
    plan = Column(String(20), nullable=False)
    currency = Column(String(3), nullable=False)
    amount = Column(Numeric(18, 4), nullable=False)
    amount_rwf = Column(Numeric(14, 2), nullable=False)
    period = Column(String(20), nullable=False)
    payment_status = Column(String(20), nullable=False, default='pending')
    payment_required = Column(Boolean, nullable=False, default=False)
    selected_at = Column(DateTime, nullable=False, default=datetime.utcnow)
