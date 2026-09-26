from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from backend.base import Base


class AccountRecovery(Base):
    __tablename__ = 'account_recovery'
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), primary_key=True)
    question = Column(Text, nullable=False)
    answer_hash = Column(Text, nullable=False)
    failures = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime, nullable=True)
    sessions_revoked_at = Column(DateTime, nullable=True)
