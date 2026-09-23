from datetime import datetime, date

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Market(Base):
    __tablename__ = "markets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    capacity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    current_demand_kg: Mapped[float] = mapped_column(Float, nullable=False)
    current_price_inr: Mapped[float] = mapped_column(Float, nullable=False)
    transport_feasibility: Mapped[str] = mapped_column(String(40), nullable=False)
    storage_available: Mapped[bool] = mapped_column(default=True)
    storage_capacity_kg: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_demo: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    region = relationship("Region", back_populates="markets")
    demand_series = relationship("MarketDemand", back_populates="market", cascade="all, delete-orphan")
    price_series = relationship("MarketPrice", back_populates="market", cascade="all, delete-orphan")
    logistics = relationship("LogisticsData", back_populates="market", cascade="all, delete-orphan")


class MarketDemand(Base):
    __tablename__ = "market_demand"
    __table_args__ = (UniqueConstraint("market_id", "crop_id", "period_date", name="uq_demand_market_crop_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"), index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), index=True)
    period_date: Mapped[date] = mapped_column(Date, index=True)
    demand_kg: Mapped[float] = mapped_column(Float, nullable=False)
    season: Mapped[str] = mapped_column(String(40), nullable=False)
    is_demo: Mapped[bool] = mapped_column(default=True)

    market = relationship("Market", back_populates="demand_series")


class MarketPrice(Base):
    __tablename__ = "market_prices"
    __table_args__ = (UniqueConstraint("market_id", "crop_id", "period_date", name="uq_price_market_crop_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"), index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), index=True)
    period_date: Mapped[date] = mapped_column(Date, index=True)
    price_inr_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    season: Mapped[str] = mapped_column(String(40), nullable=False)
    is_demo: Mapped[bool] = mapped_column(default=True)

    market = relationship("Market", back_populates="price_series")


class LogisticsData(Base):
    __tablename__ = "logistics_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"), index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.id"), index=True)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    transport_cost_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    feasibility: Mapped[str] = mapped_column(String(40), nullable=False)
    notes: Mapped[str] = mapped_column(String(255), default="DEMO DATA — estimated, not live logistics")
    is_demo: Mapped[bool] = mapped_column(default=True)

    market = relationship("Market", back_populates="logistics")
