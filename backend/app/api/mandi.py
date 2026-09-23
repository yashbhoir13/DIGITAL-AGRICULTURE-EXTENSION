from fastapi import APIRouter, Query
from app.services.mandi_service import get_all_mandi_prices, find_best_mandi_arbitrage

router = APIRouter(prefix="/mandi", tags=["mandi"])


@router.get("/live")
def get_live_mandi_prices(
    category: str | None = Query(None, description="Filter by category (Vegetable, Fruit, Cereal & Cash)"),
    search: str | None = Query(None, description="Search by crop, variety, mandi, or state"),
    state: str | None = Query(None, description="Filter by Indian State"),
):
    """Returns live daily APMC mandi wholesale rates across major crops and markets."""
    return {"commodities": get_all_mandi_prices(category=category, search=search, state=state)}


@router.get("/arbitrage")
def get_mandi_arbitrage(
    crop: str = Query("Strawberry"),
    lat: float = Query(18.5204),
    lon: float = Query(73.8567),
    quantity_kg: float = Query(1000.0, ge=10.0),
):
    """Calculates transport cost, mandi cess, and net profit to recommend the highest-paying market."""
    return find_best_mandi_arbitrage(crop, lat, lon, quantity_kg)

