from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.base import Base


class MaintenanceKnowledge(Base):
    __tablename__ = "maintenance_knowledge"

    knowledge_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    source_job_card_id: Mapped[int] = mapped_column(
        ForeignKey("job_cards.job_card_id"),
        nullable=False
    )

    equipment_id: Mapped[int] = mapped_column(
        ForeignKey("equipment.equipment_id"),
        nullable=False
    )

    problem_description: Mapped[str] = mapped_column(
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

    solution: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    parts_used: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    successful: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )

    confidence: Mapped[float] = mapped_column(
        Numeric(4, 3),
        nullable=False,
        default=1.000
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default="CURRENT_TIMESTAMP"
    )