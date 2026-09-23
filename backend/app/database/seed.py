"""DEMO / SAMPLE seed data for the academic prototype.

All generated series are labelled DEMO DATA and are not official market statistics.
"""

from __future__ import annotations

import math
import random
from datetime import date, datetime
from calendar import monthrange

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.agri_data import AgriculturalData, ProductionRecord, WeatherData
from app.models.crop import Crop, CropCycle
from app.models.farm import Farm, SoilData
from app.models.market import LogisticsData, Market, MarketDemand, MarketPrice
from app.models.region import Region
from app.models.user import User

random.seed(42)


REGIONS = [
    dict(name="Pune Belt", state="Maharashtra", climate_zone="semi-arid", avg_rainfall_mm=650, avg_temp_c=25.5, notes="APMC Pune / Western Maharashtra vegetable hub"),
    dict(name="Nashik", state="Maharashtra", climate_zone="semi-arid", avg_rainfall_mm=700, avg_temp_c=24.0, notes="Lasalgaon / Pimpalgaon onion & grape belt"),
    dict(name="Mahabaleshwar", state="Maharashtra", climate_zone="subtropical highland", avg_rainfall_mm=2200, avg_temp_c=18.5, notes="Satara strawberry cluster"),
    dict(name="Mumbai Metro", state="Maharashtra", climate_zone="coastal humid", avg_rainfall_mm=2100, avg_temp_c=27.5, notes="Vashi APMC terminal market"),
    dict(name="Bengaluru Rural", state="Karnataka", climate_zone="tropical savanna", avg_rainfall_mm=850, avg_temp_c=23.5, notes="Yeshwanthpur & Kolar tomato market"),
    dict(name="Delhi NCR", state="Delhi", climate_zone="semi-arid", avg_rainfall_mm=750, avg_temp_c=25.0, notes="Azadpur APMC terminal mandi"),
    dict(name="Nagpur Belt", state="Maharashtra", climate_zone="tropical wet and dry", avg_rainfall_mm=1100, avg_temp_c=26.8, notes="Orange & soybean hub"),
    dict(name="Solapur Belt", state="Maharashtra", climate_zone="arid", avg_rainfall_mm=550, avg_temp_c=28.5, notes="Pomegranate & pulse cluster"),
    dict(name="Shimla Hills", state="Himachal Pradesh", climate_zone="temperate highland", avg_rainfall_mm=1200, avg_temp_c=16.0, notes="Apple & temperate vegetable cluster"),
]

CROPS = [
    # Fruits
    dict(name="Strawberry", category="Fruit", cultivation_days=90, suitable_soil="loam, sandy loam", water_requirement="high", suitable_season="rabi, winter", min_temp_c=10, max_temp_c=24, expected_yield_kg_per_ha=18000, storage_requirement="cold storage 0-2C", perishability="high"),
    dict(name="Grapes", category="Fruit", cultivation_days=150, suitable_soil="sandy loam, loam", water_requirement="moderate", suitable_season="rabi, winter", min_temp_c=15, max_temp_c=35, expected_yield_kg_per_ha=20000, storage_requirement="cold storage", perishability="high"),
    dict(name="Banana", category="Fruit", cultivation_days=300, suitable_soil="loam, clay loam", water_requirement="high", suitable_season="all", min_temp_c=20, max_temp_c=35, expected_yield_kg_per_ha=35000, storage_requirement="cool storage", perishability="high"),
    dict(name="Apple", category="Fruit", cultivation_days=150, suitable_soil="loam, rich clay", water_requirement="moderate", suitable_season="kharif, rabi", min_temp_c=8, max_temp_c=24, expected_yield_kg_per_ha=15000, storage_requirement="cold CA storage", perishability="medium"),
    dict(name="Pomegranate", category="Fruit", cultivation_days=180, suitable_soil="well-drained loam", water_requirement="low", suitable_season="all", min_temp_c=15, max_temp_c=38, expected_yield_kg_per_ha=14000, storage_requirement="cool ventilated", perishability="medium"),
    dict(name="Orange", category="Fruit", cultivation_days=240, suitable_soil="light loam, sandy", water_requirement="moderate", suitable_season="kharif, rabi", min_temp_c=14, max_temp_c=35, expected_yield_kg_per_ha=18000, storage_requirement="cool storage", perishability="high"),
    dict(name="Mango", category="Fruit", cultivation_days=120, suitable_soil="alluvial, laterite", water_requirement="moderate", suitable_season="zaid, summer", min_temp_c=22, max_temp_c=40, expected_yield_kg_per_ha=12000, storage_requirement="cool ventilated", perishability="high"),
    dict(name="Papaya", category="Fruit", cultivation_days=270, suitable_soil="rich sandy loam", water_requirement="high", suitable_season="all", min_temp_c=18, max_temp_c=36, expected_yield_kg_per_ha=40000, storage_requirement="cool storage", perishability="high"),

    # Vegetables
    dict(name="Tomato", category="Vegetable", cultivation_days=90, suitable_soil="loam, clay loam", water_requirement="moderate", suitable_season="rabi, zaid, kharif", min_temp_c=15, max_temp_c=32, expected_yield_kg_per_ha=25000, storage_requirement="cool ventilated", perishability="high"),
    dict(name="Onion", category="Vegetable", cultivation_days=120, suitable_soil="loam, sandy loam", water_requirement="moderate", suitable_season="rabi, kharif", min_temp_c=13, max_temp_c=30, expected_yield_kg_per_ha=20000, storage_requirement="dry ventilated", perishability="medium"),
    dict(name="Potato", category="Tuber", cultivation_days=100, suitable_soil="sandy loam, loam", water_requirement="moderate", suitable_season="rabi", min_temp_c=10, max_temp_c=25, expected_yield_kg_per_ha=22000, storage_requirement="cold storage", perishability="medium"),
    dict(name="Green Chilli", category="Vegetable", cultivation_days=110, suitable_soil="loam, clay loam", water_requirement="moderate", suitable_season="kharif, rabi", min_temp_c=18, max_temp_c=32, expected_yield_kg_per_ha=8000, storage_requirement="dry ventilated", perishability="medium"),
    dict(name="Cauliflower", category="Vegetable", cultivation_days=75, suitable_soil="loam, clay loam", water_requirement="moderate", suitable_season="rabi", min_temp_c=12, max_temp_c=25, expected_yield_kg_per_ha=18000, storage_requirement="cool storage", perishability="high"),
    dict(name="Cabbage", category="Vegetable", cultivation_days=80, suitable_soil="well-drained loam", water_requirement="moderate", suitable_season="rabi, winter", min_temp_c=12, max_temp_c=24, expected_yield_kg_per_ha=22000, storage_requirement="cool storage", perishability="medium"),
    dict(name="Brinjal", category="Vegetable", cultivation_days=100, suitable_soil="loam, silt loam", water_requirement="moderate", suitable_season="all", min_temp_c=16, max_temp_c=34, expected_yield_kg_per_ha=24000, storage_requirement="cool ventilated", perishability="high"),
    dict(name="Ladyfinger", category="Vegetable", cultivation_days=60, suitable_soil="sandy loam to clay", water_requirement="moderate", suitable_season="kharif, zaid", min_temp_c=20, max_temp_c=36, expected_yield_kg_per_ha=12000, storage_requirement="cool ventilated", perishability="high"),
    dict(name="Ginger", category="Vegetable", cultivation_days=210, suitable_soil="rich sandy loam", water_requirement="high", suitable_season="kharif", min_temp_c=18, max_temp_c=32, expected_yield_kg_per_ha=15000, storage_requirement="dry dark store", perishability="low"),
    dict(name="Garlic", category="Vegetable", cultivation_days=130, suitable_soil="rich loamy soil", water_requirement="moderate", suitable_season="rabi", min_temp_c=12, max_temp_c=28, expected_yield_kg_per_ha=9000, storage_requirement="dry ventilated", perishability="low"),
    dict(name="Capsicum", category="Vegetable", cultivation_days=90, suitable_soil="porous loam", water_requirement="moderate", suitable_season="rabi, zaid", min_temp_c=15, max_temp_c=28, expected_yield_kg_per_ha=16000, storage_requirement="cool storage", perishability="high"),

    # Cereals & Commercial
    dict(name="Wheat", category="Cereal", cultivation_days=130, suitable_soil="loam, clay loam", water_requirement="moderate", suitable_season="rabi", min_temp_c=10, max_temp_c=25, expected_yield_kg_per_ha=4500, storage_requirement="dry godown", perishability="low"),
    dict(name="Rice", category="Cereal", cultivation_days=120, suitable_soil="clay, clay loam", water_requirement="high", suitable_season="kharif", min_temp_c=20, max_temp_c=35, expected_yield_kg_per_ha=4000, storage_requirement="dry godown", perishability="low"),
    dict(name="Soybean", category="Oilseed", cultivation_days=100, suitable_soil="deep fertile loam", water_requirement="moderate", suitable_season="kharif", min_temp_c=18, max_temp_c=32, expected_yield_kg_per_ha=2500, storage_requirement="dry godown", perishability="low"),
    dict(name="Cotton", category="Fibre", cultivation_days=160, suitable_soil="black cotton, clay loam", water_requirement="moderate", suitable_season="kharif", min_temp_c=21, max_temp_c=35, expected_yield_kg_per_ha=1800, storage_requirement="dry godown", perishability="low"),
]

MARKETS = [
    dict(region="Pune Belt", name="Pune APMC (Gultekdi)", location="Market Yard, Gultekdi, Pune", capacity_kg=35000, current_demand_kg=18000, current_price_inr=35, transport_feasibility="high", storage_available=True, storage_capacity_kg=22000),
    dict(region="Nashik", name="Nashik (Pimpalgaon APMC)", location="Pimpalgaon Baswant, Nashik", capacity_kg=30000, current_demand_kg=20000, current_price_inr=30, transport_feasibility="high", storage_available=True, storage_capacity_kg=20000),
    dict(region="Nashik", name="Lasalgaon APMC", location="Lasalgaon, Nashik", capacity_kg=45000, current_demand_kg=32000, current_price_inr=58, transport_feasibility="high", storage_available=True, storage_capacity_kg=30000),
    dict(region="Mahabaleshwar", name="Mahabaleshwar Mandi", location="Mahabaleshwar Market", capacity_kg=6000, current_demand_kg=3500, current_price_inr=210, transport_feasibility="medium", storage_available=True, storage_capacity_kg=1500),
    dict(region="Mumbai Metro", name="Mumbai Vashi APMC", location="Turbhe, Navi Mumbai", capacity_kg=55000, current_demand_kg=35000, current_price_inr=38, transport_feasibility="high", storage_available=True, storage_capacity_kg=35000),
    dict(region="Bengaluru Rural", name="Bengaluru Yeshwanthpur APMC", location="Yeshwanthpur, Bengaluru", capacity_kg=40000, current_demand_kg=24000, current_price_inr=32, transport_feasibility="high", storage_available=True, storage_capacity_kg=25000),
    dict(region="Delhi NCR", name="Delhi Azadpur Mandi", location="Azadpur, North Delhi", capacity_kg=85000, current_demand_kg=52000, current_price_inr=36, transport_feasibility="high", storage_available=True, storage_capacity_kg=50000),
    dict(region="Nagpur Belt", name="Nagpur APMC (Kalamna)", location="Kalamna, Nagpur", capacity_kg=28000, current_demand_kg=16000, current_price_inr=48, transport_feasibility="high", storage_available=True, storage_capacity_kg=18000),
    dict(region="Solapur Belt", name="Solapur APMC Yard", location="Solapur Market", capacity_kg=22000, current_demand_kg=13000, current_price_inr=98, transport_feasibility="high", storage_available=True, storage_capacity_kg=14000),
    dict(region="Shimla Hills", name="Shimla Sabzi Mandi", location="Shimla Yard", capacity_kg=15000, current_demand_kg=8000, current_price_inr=130, transport_feasibility="medium", storage_available=True, storage_capacity_kg=8000),
]

CROP_PRICE_BASE = {
    "Strawberry": 245, "Tomato": 35, "Onion": 58, "Potato": 28, "Wheat": 30,
    "Rice": 34, "Grapes": 115, "Green Chilli": 68, "Banana": 34, "Cotton": 72,
    "Cauliflower": 44, "Cabbage": 22, "Brinjal": 44, "Ladyfinger": 48, "Ginger": 120,
    "Garlic": 185, "Capsicum": 54, "Apple": 158, "Pomegranate": 115, "Orange": 64,
    "Mango": 340, "Papaya": 28, "Soybean": 46,
}
CROP_DEMAND_BASE = {
    "Strawberry": 2200, "Tomato": 9500, "Onion": 11000, "Potato": 8500, "Wheat": 14000,
    "Rice": 12000, "Grapes": 4200, "Green Chilli": 3200, "Banana": 6500, "Cotton": 2500,
    "Cauliflower": 5000, "Cabbage": 5500, "Brinjal": 3800, "Ladyfinger": 3200, "Ginger": 1800,
    "Garlic": 2100, "Capsicum": 2800, "Apple": 7500, "Pomegranate": 4000, "Orange": 6000,
    "Mango": 5000, "Papaya": 4500, "Soybean": 6500,
}


def _season(month: int) -> str:
    if month in (6, 7, 8, 9):
        return "kharif"
    if month in (10, 11, 12, 1):
        return "rabi"
    return "zaid"


def seed_if_empty(db: Session) -> None:
    if db.query(User).first():
        return
    seed_all(db)


def seed_all(db: Session) -> None:
    admin = db.query(User).filter(User.email == "admin@agri.demo").first()
    if not admin:
        admin = User(full_name="System Admin", email="admin@agri.demo", hashed_password=hash_password("admin123"), role="admin")
        db.add(admin)
    farmer = db.query(User).filter(User.email == "farmer@agri.demo").first()
    if not farmer:
        farmer = User(full_name="Demo Farmer", email="farmer@agri.demo", hashed_password=hash_password("farmer123"), role="farmer")
        db.add(farmer)
    db.flush()


    region_map: dict[str, Region] = {}
    for r in REGIONS:
        obj = Region(**r, is_demo=True)
        db.add(obj)
        db.flush()
        region_map[obj.name] = obj

    crop_map: dict[str, Crop] = {}
    for c in CROPS:
        obj = Crop(**c, notes="DEMO DATA — indicative agronomic parameters", is_demo=True)
        db.add(obj)
        db.flush()
        crop_map[obj.name] = obj
        if obj.name in ("Wheat", "Potato", "Strawberry", "Onion", "Cauliflower", "Cabbage", "Garlic", "Capsicum"):
            db.add(CropCycle(crop_id=obj.id, season="rabi", sowing_month=10, harvest_month=2, notes="Rabi winter cycle"))
        elif obj.name in ("Rice", "Cotton", "Green Chilli", "Soybean", "Ginger"):
            db.add(CropCycle(crop_id=obj.id, season="kharif", sowing_month=6, harvest_month=10, notes="Kharif monsoon cycle"))
        else:
            db.add(CropCycle(crop_id=obj.id, season="all", sowing_month=2, harvest_month=6, notes="Perennial / multi-season cycle"))

    market_objs: list[Market] = []
    for m in MARKETS:
        region = region_map[m["region"]]
        payload = {k: v for k, v in m.items() if k != "region"}
        obj = Market(region_id=region.id, **payload, notes="DEMO DATA — not live mandi feed", is_demo=True)
        db.add(obj)
        db.flush()
        market_objs.append(obj)

    farm = Farm(
        user_id=farmer.id,
        region_id=region_map["Mahabaleshwar"].id,
        name="Demo Highland Farm",
        location="Mahabaleshwar, Satara (DEMO)",
        land_area_ha=1.5,
        water_availability="high",
        season="rabi",
        climate_notes="Cool nights, DEMO profile",
        crop_preferences="Strawberry, Tomato",
        expected_quantity_kg=20000,
    )
    db.add(farm)
    db.flush()
    db.add(
        SoilData(
            farm_id=farm.id,
            soil_type="loam",
            ph=6.4,
            organic_matter_pct=2.8,
            nitrogen="medium",
            phosphorus="medium",
            potassium="high",
            moisture="moderate",
        )
    )

    start = date(2023, 1, 1)
    months = 36
    for i in range(months):
        y = start.year + (start.month - 1 + i) // 12
        m = (start.month - 1 + i) % 12 + 1
        d = date(y, m, 1)
        season = _season(m)
        for region in region_map.values():
            rain = max(0, region.avg_rainfall_mm / 12 + 40 * math.sin(2 * math.pi * m / 12) + random.uniform(-8, 8))
            temp = region.avg_temp_c + 4 * math.sin(2 * math.pi * (m - 4) / 12) + random.uniform(-0.8, 0.8)
            db.add(
                WeatherData(
                    region_id=region.id,
                    period_date=d,
                    rainfall_mm=round(rain, 1),
                    avg_temp_c=round(temp, 1),
                    humidity_pct=round(55 + 15 * math.sin(2 * math.pi * m / 12), 1),
                    is_demo=True,
                )
            )
        for market in market_objs:
            mregion = next(r for r in region_map.values() if r.id == market.region_id)
            for crop_name, crop in crop_map.items():
                base_d = CROP_DEMAND_BASE[crop_name]
                # strawberry peaks in winter in hill markets
                seasonal = 1 + 0.25 * math.sin(2 * math.pi * (m - 1) / 12)
                if crop_name == "Strawberry" and "highland" in mregion.climate_zone:
                    seasonal = 1 + 0.45 * math.sin(2 * math.pi * (m + 1) / 12)
                if crop_name == "Onion" and "Nashik" in market.name:
                    seasonal *= 1.25
                demand = max(80, base_d * seasonal * (0.55 + 0.08 * (market.capacity_kg / 25000)) + random.uniform(-80, 80))
                db.add(
                    MarketDemand(
                        market_id=market.id,
                        crop_id=crop.id,
                        period_date=d,
                        demand_kg=round(demand, 1),
                        season=season,
                        is_demo=True,
                    )
                )
                base_p = CROP_PRICE_BASE[crop_name]
                price = max(1.0, base_p * (0.85 + 0.2 * math.sin(2 * math.pi * (m + 3) / 12)) + random.uniform(-1.2, 1.2))
                db.add(
                    MarketPrice(
                        market_id=market.id,
                        crop_id=crop.id,
                        period_date=d,
                        price_inr_per_kg=round(price, 2),
                        season=season,
                        is_demo=True,
                    )
                )

    for region in region_map.values():
        for crop in crop_map.values():
            for year in (2023, 2024, 2025):
                area = random.uniform(80, 400)
                prod = area * crop.expected_yield_kg_per_ha * random.uniform(0.75, 1.1)
                db.add(
                    AgriculturalData(
                        region_id=region.id,
                        crop_id=crop.id,
                        year=year,
                        season="mixed",
                        area_ha=round(area, 1),
                        production_kg=round(prod, 1),
                        notes="DEMO DATA",
                        is_demo=True,
                    )
                )
                db.add(
                    ProductionRecord(
                        farm_id=farm.id if region.name == "Mahabaleshwar" else None,
                        region_id=region.id,
                        crop_id=crop.id,
                        harvest_date=date(year, 3, 15),
                        quantity_kg=round(prod * 0.02, 1),
                        yield_kg_per_ha=round(prod / area, 1),
                        is_demo=True,
                    )
                )

    # logistics: distance from each region to each market (km)
    coords = {
        "Pune Belt": (18.52, 73.85),
        "Nashik": (19.99, 73.78),
        "Mahabaleshwar": (17.92, 73.65),
        "Mumbai Metro": (19.07, 72.87),
        "Bengaluru Rural": (13.28, 77.78),
        "Delhi NCR": (28.70, 77.10),
        "Nagpur Belt": (21.14, 79.08),
        "Solapur Belt": (17.65, 75.90),
        "Shimla Hills": (31.10, 77.17),
    }
    for rname, region in region_map.items():
        lat1, lon1 = coords.get(rname, (18.52, 73.85))
        for market in market_objs:
            r2 = next((n for n, obj in region_map.items() if obj.id == market.region_id), "Pune Belt")
            lat2, lon2 = coords.get(r2, (18.52, 73.85))
            dist = math.hypot((lat1 - lat2) * 111, (lon1 - lon2) * 100) + 8
            feas = "high" if dist < 180 else "medium" if dist < 700 else "low"
            db.add(
                LogisticsData(
                    market_id=market.id,
                    region_id=region.id,
                    distance_km=round(dist, 1),
                    transport_cost_per_kg=round(0.4 + dist * 0.012, 2),
                    feasibility=feas,
                    notes="Estimated highway route logistics",
                    is_demo=False,
                )
            )

    db.commit()


def reseed_all(db: Session) -> None:
    """Wipes existing seed data and loads real-world benchmark data."""
    from sqlalchemy import text
    tables = [
        "logistics_data", "production_records", "agricultural_data",
        "market_prices", "market_demand", "weather_data", "soil_data",
        "farms", "crop_cycles", "markets", "crops", "regions"
    ]
    for table in tables:
        try:
            db.execute(text(f"DELETE FROM {table}"))
        except Exception:
            pass
    db.commit()
    seed_all(db)

