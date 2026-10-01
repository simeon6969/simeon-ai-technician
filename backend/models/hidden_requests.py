from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.base import Base

class HiddenRequest(Base):
    __tablename__ = 'hidden_item_requests'
    request_id: Mapped[int] = mapped_column(ForeignKey('item_requests.request_id', ondelete='CASCADE'), primary_key=True)
