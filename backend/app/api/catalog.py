from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin
from app.database.session import get_db
from app.models.crop import Crop
from app.models.farm import Farm, SoilData
from app.models.market import Market, MarketDemand, MarketPrice, LogisticsData
from app.models.region import Region
from app.models.user import User
from app.schemas.common import (
    CropCreate,
    CropOut,
    FarmCreate,
    FarmOut,
    MarketCreate,
    MarketOut,
    RegionCreate,
    RegionOut,
    SoilIn,
)

router = APIRouter(tags=["catalog"])


@router.get("/regions", response_model=list[RegionOut])
def list_regions(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Region).order_by(Region.name).all()


@router.post("/regions", response_model=RegionOut)
def create_region(payload: RegionCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = Region(**payload.model_dump(), is_demo=False)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/crops", response_model=list[CropOut])
def list_crops(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Crop).order_by(Crop.name).all()


@router.get("/crops/{crop_id}", response_model=CropOut)
def get_crop(crop_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    crop = db.query(Crop).get(crop_id)
    if not crop:
        raise HTTPException(404, "Crop not found")
    return crop


@router.post("/crops", response_model=CropOut)
def create_crop(payload: CropCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(Crop).filter(Crop.name == payload.name).first():
        raise HTTPException(400, "Crop already exists")
    obj = Crop(**payload.model_dump(), is_demo=False)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/crops/{crop_id}", response_model=CropOut)
def update_crop(crop_id: int, payload: CropCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    crop = db.query(Crop).get(crop_id)
    if not crop:
        raise HTTPException(404, "Crop not found")
    for k, v in payload.model_dump().items():
        setattr(crop, k, v)
    db.commit()
    db.refresh(crop)
    return crop


@router.delete("/crops/{crop_id}")
def delete_crop(crop_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    crop = db.query(Crop).get(crop_id)
    if not crop:
        raise HTTPException(404, "Crop not found")
    db.delete(crop)
    db.commit()
    return {"ok": True}


@router.get("/markets", response_model=list[MarketOut])
def list_markets(region_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(Market)
    if region_id:
        q = q.filter(Market.region_id == region_id)
    return q.order_by(Market.name).all()


@router.post("/markets", response_model=MarketOut)
def create_market(payload: MarketCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = Market(**payload.model_dump(), is_demo=False)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/markets/{market_id}", response_model=MarketOut)
def update_market(market_id: int, payload: MarketCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    market = db.query(Market).get(market_id)
    if not market:
        raise HTTPException(404, "Market not found")
    for k, v in payload.model_dump().items():
        setattr(market, k, v)
    db.commit()
    db.refresh(market)
    return market


@router.delete("/markets/{market_id}")
def delete_market(market_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    market = db.query(Market).get(market_id)
    if not market:
        raise HTTPException(404, "Market not found")
    db.delete(market)
    db.commit()
    return {"ok": True}


@router.get("/markets/{market_id}/history")
def market_history(market_id: int, crop_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    market = db.query(Market).get(market_id)
    if not market:
        raise HTTPException(404, "Market not found")
    dq = db.query(MarketDemand).filter(MarketDemand.market_id == market_id)
    pq = db.query(MarketPrice).filter(MarketPrice.market_id == market_id)
    if crop_id:
        dq = dq.filter(MarketDemand.crop_id == crop_id)
        pq = pq.filter(MarketPrice.crop_id == crop_id)
    demand = [
        {"period_date": r.period_date, "crop_id": r.crop_id, "demand_kg": r.demand_kg}
        for r in dq.order_by(MarketDemand.period_date).limit(500).all()
    ]
    prices = [
        {"period_date": r.period_date, "crop_id": r.crop_id, "price_inr_per_kg": r.price_inr_per_kg}
        for r in pq.order_by(MarketPrice.period_date).limit(500).all()
    ]
    logistics = db.query(LogisticsData).filter(LogisticsData.market_id == market_id).all()
    return {
        "market": MarketOut.model_validate(market),
        "demand": demand,
        "prices": prices,
        "logistics": [
            {
                "region_id": l.region_id,
                "distance_km": l.distance_km,
                "transport_cost_per_kg": l.transport_cost_per_kg,
                "feasibility": l.feasibility,
                "notes": l.notes,
            }
            for l in logistics
        ],
        "disclaimer": "Market logistics data",
    }


@router.get("/farms", response_model=list[FarmOut])
def list_farms(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Farm)
    if user.role != "admin":
        q = q.filter(Farm.user_id == user.id)
    farms = q.all()
    out = []
    for f in farms:
        soil = None
        if f.soil:
            soil = SoilIn(
                soil_type=f.soil.soil_type,
                ph=f.soil.ph,
                organic_matter_pct=f.soil.organic_matter_pct,
                nitrogen=f.soil.nitrogen,
                phosphorus=f.soil.phosphorus,
                potassium=f.soil.potassium,
                moisture=f.soil.moisture,
            )
        out.append(
            FarmOut(
                id=f.id,
                user_id=f.user_id,
                region_id=f.region_id,
                name=f.name,
                location=f.location,
                land_area_ha=f.land_area_ha,
                water_availability=f.water_availability,
                season=f.season,
                climate_notes=f.climate_notes,
                crop_preferences=f.crop_preferences,
                expected_quantity_kg=f.expected_quantity_kg,
                soil=soil,
            )
        )
    return out


@router.post("/farms", response_model=FarmOut)
def create_farm(payload: FarmCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.query(Region).get(payload.region_id):
        raise HTTPException(400, "Invalid region")
    farm = Farm(
        user_id=user.id,
        region_id=payload.region_id,
        name=payload.name,
        location=payload.location,
        land_area_ha=payload.land_area_ha,
        water_availability=payload.water_availability,
        season=payload.season,
        climate_notes=payload.climate_notes,
        crop_preferences=payload.crop_preferences,
        expected_quantity_kg=payload.expected_quantity_kg,
    )
    db.add(farm)
    db.flush()
    db.add(SoilData(farm_id=farm.id, **payload.soil.model_dump()))
    db.commit()
    db.refresh(farm)
    return list_farms(db, user)[-1]


@router.put("/farms/{farm_id}", response_model=FarmOut)
def update_farm(farm_id: int, payload: FarmCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    farm = db.query(Farm).get(farm_id)
    if not farm or (user.role != "admin" and farm.user_id != user.id):
        raise HTTPException(404, "Farm not found")
    farm.region_id = payload.region_id
    farm.name = payload.name
    farm.location = payload.location
    farm.land_area_ha = payload.land_area_ha
    farm.water_availability = payload.water_availability
    farm.season = payload.season
    farm.climate_notes = payload.climate_notes
    farm.crop_preferences = payload.crop_preferences
    farm.expected_quantity_kg = payload.expected_quantity_kg
    if farm.soil:
        for k, v in payload.soil.model_dump().items():
            setattr(farm.soil, k, v)
    else:
        db.add(SoilData(farm_id=farm.id, **payload.soil.model_dump()))
    db.commit()
    farms = list_farms(db, user)
    return next(f for f in farms if f.id == farm_id)
