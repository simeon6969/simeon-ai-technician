from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column
from backend.base import Base


class CommissionSettings(Base):
    __tablename__ = 'commission_settings'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    payer: Mapped[str] = mapped_column(String(10), default='client')
    starting_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    minimum_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    reduction_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    momo_number: Mapped[str] = mapped_column(String(30), default='0786854200')


class CommissionAgreement(Base):
    __tablename__ = 'commission_agreements'
    request_id: Mapped[int] = mapped_column(ForeignKey('item_requests.request_id', ondelete='CASCADE'), primary_key=True)
    payer: Mapped[str] = mapped_column(String(10))
    listed_price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(3))
    starting_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    minimum_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    reduction_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    current_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    momo_number: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(24), default='negotiating')
    revision: Mapped[int] = mapped_column(Integer, default=0)
    __mapper_args__ = {'version_id_col': revision}
    payment_reference: Mapped[str | None] = mapped_column(String(200), nullable=True)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    history: Mapped[list] = mapped_column(JSON, default=list)


class PaymentReviewNotification(Base):
    __tablename__ = 'payment_review_notifications'
    __table_args__ = (UniqueConstraint('request_id', 'revision'),)
    notification_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey('item_requests.request_id', ondelete='CASCADE'), index=True)
    revision: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text('CURRENT_TIMESTAMP'), index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
