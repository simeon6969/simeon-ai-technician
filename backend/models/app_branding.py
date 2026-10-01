from sqlalchemy import Text, String
from sqlalchemy.orm import Mapped, mapped_column
from backend.base import Base

class AppBranding(Base):
    __tablename__ = 'app_branding'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), default='S')
    logo: Mapped[str | None] = mapped_column(Text, nullable=True)
