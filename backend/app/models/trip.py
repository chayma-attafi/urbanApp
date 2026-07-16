from sqlalchemy import CHAR, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(CHAR(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    priority = Column(String(50), nullable=False)
    co2_raw = Column(String(255), nullable=False)
    co2_kg = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
