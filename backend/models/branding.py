from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.base import Base

class AccountBranding(Base):
    __tablename__ = 'account_branding'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.user_id', ondelete='CASCADE'), primary_key=True)
    image_data: Mapped[str] = mapped_column(Text)
