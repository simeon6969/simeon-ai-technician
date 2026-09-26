from sqlalchemy import Column, Integer, String
from backend.base import Base


class DeliveryContact(Base):
    __tablename__ = 'delivery_contacts'
    id = Column(Integer, primary_key=True)
    phone = Column(String(20), nullable=False, default='')
    whatsapp = Column(String(20), nullable=False, default='')
    email = Column(String(254), nullable=False, default='')
