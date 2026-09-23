from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    cultivation_days: Mapped[int] = mapped_column(Integer, nullable=False)
    suitable_soil: Mapped[str] = mapped_column(String(160), nullable=False)
    water_requirement: Mapped[str] = mapped_column(String(40), nullable=False)
    suitable_season: Mapped[str] = mapped_column(String(80), nullable=False)
    min_temp_c: Mapped[float] = mapped_column(Float, nullable=False)
    max_temp_c: Mapped[float] = mapped_column(Float, nullable=False)
    expected_yield_kg_per_ha: Mapped[float] = mapped_column(Float, nullable=False)
    storage_requirement: Mapped[str] = mapped_column(String(80), nullable=False)
    perishability: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    cycles = relationship("CropCycle", back_populates="crop", cascade="all, delete-orphan")


class CropCycle(Base):
    __tablename__ = "crop_cycles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), index=True)
    season: Mapped[str] = mapped_column(String(40), nullable=False)
    sowing_month: Mapped[int] = mapped_column(Integer, nullable=False)
    harvest_month: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    crop = relationship("Crop", back_populates="cycles")
