from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from backend.base import Base

class AccountLocation(Base):
    __tablename__ = 'account_locations'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.user_id', ondelete='CASCADE'), primary_key=True)
    location: Mapped[str] = mapped_column(String(500), default='')
