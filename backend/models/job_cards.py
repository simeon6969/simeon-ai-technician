from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import text
from backend.base import Base


class JobCard(Base):
    __tablename__ = "job_cards"

    account_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    submitter_name: Mapped[str | None] = mapped_column(String(150), nullable=True)

    job_card_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    technician_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=False
    )

    equipment_id: Mapped[int] = mapped_column(
        ForeignKey("equipment.equipment_id"),
        nullable=False
    )

    maintenance_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    fault_description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    symptoms: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    diagnosis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    actions_taken: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    parts_used: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    result: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    photo_data: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    attachments_data: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    successful: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="submitted"
    )

    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )
