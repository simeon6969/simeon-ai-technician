from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.base import Base


class SparePart(Base):
    __tablename__ = "spare_parts"

    spare_part_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    submitted_by: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=False
    )

    equipment_id: Mapped[int | None] = mapped_column(
        ForeignKey("equipment.equipment_id"),
        nullable=True
    )

    part_number: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    part_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    manufacturer: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    specifications: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    compatibility: Mapped[str | None] = mapped_column(
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

    availability_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="available"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default="CURRENT_TIMESTAMP"
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default="CURRENT_TIMESTAMP"
    )