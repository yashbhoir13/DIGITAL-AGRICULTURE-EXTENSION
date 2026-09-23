from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    land_area_ha: Mapped[float] = mapped_column(Float, nullable=False)
    water_availability: Mapped[str] = mapped_column(String(40), nullable=False)
    season: Mapped[str] = mapped_column(String(40), nullable=False)
    climate_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    crop_preferences: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expected_quantity_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="farms")
    region = relationship("Region", back_populates="farms")
    soil = relationship("SoilData", back_populates="farm", uselist=False, cascade="all, delete-orphan")


class SoilData(Base):
    __tablename__ = "soil_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"), unique=True, index=True)
    soil_type: Mapped[str] = mapped_column(String(80), nullable=False)
    ph: Mapped[float] = mapped_column(Float, nullable=False)
    organic_matter_pct: Mapped[float] = mapped_column(Float, nullable=False)
    nitrogen: Mapped[str] = mapped_column(String(20), default="medium")
    phosphorus: Mapped[str] = mapped_column(String(20), default="medium")
    potassium: Mapped[str] = mapped_column(String(20), default="medium")
    moisture: Mapped[str] = mapped_column(String(20), default="moderate")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    farm = relationship("Farm", back_populates="soil")
