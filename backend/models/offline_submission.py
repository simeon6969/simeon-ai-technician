from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from backend.base import Base


class OfflineSubmission(Base):
    __tablename__ = 'offline_submissions'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), primary_key=True)
    submission_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    fingerprint: Mapped[str] = mapped_column(String(64))
    kind: Mapped[str] = mapped_column(String(10))
    record_id: Mapped[int] = mapped_column(Integer)
