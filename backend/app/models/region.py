from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Region(Base):
    __tablename__ = "regions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    climate_zone: Mapped[str] = mapped_column(String(80), nullable=False)
    avg_rainfall_mm: Mapped[float] = mapped_column(Float, nullable=False)
    avg_temp_c: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    farms = relationship("Farm", back_populates="region")
    markets = relationship("Market", back_populates="region")
