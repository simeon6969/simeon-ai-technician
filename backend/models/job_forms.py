from datetime import datetime
from sqlalchemy import Integer, JSON, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.base import Base

class JobFormVersion(Base):
    __tablename__ = 'job_form_versions'
    version: Mapped[int] = mapped_column(Integer, primary_key=True)
    questions: Mapped[list] = mapped_column(JSON)

class JobSheetSettings(Base):
    __tablename__ = 'job_sheet_settings'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    spreadsheet_id: Mapped[str] = mapped_column(String(150))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

class JobSheetSubmission(Base):
    __tablename__ = 'job_sheet_submissions'
    job_card_id: Mapped[int] = mapped_column(ForeignKey('job_cards.job_card_id', ondelete='CASCADE'), primary_key=True)
    form_version: Mapped[int] = mapped_column(Integer, default=0)
    questions: Mapped[list] = mapped_column(JSON)
    answers: Mapped[dict] = mapped_column(JSON)
    synced: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    retry_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
