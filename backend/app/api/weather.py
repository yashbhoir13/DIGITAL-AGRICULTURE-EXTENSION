from fastapi import APIRouter, Query
from app.services.weather_service import fetch_live_agro_weather

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/live")
async def get_live_weather(
    lat: float = Query(18.5204, description="Latitude (default Pune/Mahabaleshwar region)"),
    lon: float = Query(73.8567, description="Longitude (default Pune/Mahabaleshwar region)"),
):
    """Fetches real-time agro-meteorological microclimate and pest/spraying advisories."""
    return await fetch_live_agro_weather(lat, lon)
