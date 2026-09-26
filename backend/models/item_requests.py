from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column
from backend.base import Base


class ItemRequest(Base):
    __tablename__ = 'item_requests'
    __table_args__ = (UniqueConstraint('requester_id', 'sale_item_id'), UniqueConstraint('requester_id', 'spare_part_id'))
    request_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    requester_id: Mapped[int] = mapped_column(ForeignKey('users.user_id', ondelete='CASCADE'))
    seller_id: Mapped[int] = mapped_column(ForeignKey('users.user_id', ondelete='CASCADE'))
    sale_item_id: Mapped[int | None] = mapped_column(ForeignKey('sale_items.item_id', ondelete='CASCADE'), nullable=True)
    spare_part_id: Mapped[int | None] = mapped_column(ForeignKey('spare_parts.spare_part_id', ondelete='CASCADE'), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='pending')
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
