from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, require_admin
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import (
    AllocationRequest,
    DashboardOut,
    ForecastResponse,
    ProductionRequest,
    ProductionResponse,
    RecommendRequest,
    ScheduleRequest,
    ScheduleResponse,
    SupplyDemandRequest,
    SupplyDemandResponse,
    VisionResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from app.services import intelligence as eng
from vision.inference.detect import detect_strawberries

router = APIRouter(tags=["intelligence"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    region_id: int | None = None,
    crop_id: int | None = None,
    farm_id: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        return eng.dashboard_summary(db, region_id, crop_id, farm_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"Dashboard unavailable: {exc}") from exc


@router.get("/demand/forecast", response_model=ForecastResponse)
def demand_forecast(
    crop_id: int = Query(...),
    region_id: int | None = None,
    market_id: int | None = None,
    horizon: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        data = eng.forecast_demand(db, crop_id, region_id, market_id, horizon)
        return {**data, "disclaimer": "Baseline Ridge regression predictive demand analytics."}
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.get("/prices/forecast", response_model=ForecastResponse)
def price_forecast(
    crop_id: int = Query(...),
    region_id: int | None = None,
    market_id: int | None = None,
    horizon: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        data = eng.forecast_price(db, crop_id, region_id, market_id, horizon)
        return {**data, "disclaimer": "Baseline Ridge regression predictive price analytics."}
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post("/production/estimate", response_model=ProductionResponse)
def production(payload: ProductionRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return eng.production_estimate(db, payload.crop_id, payload.farm_id, payload.land_area_ha, payload.region_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post("/recommendations/crops")
def recommendations(payload: RecommendRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return {"items": eng.recommend_crops(db, payload.farm_id), "disclaimer": "Combined agronomic and market evaluation scores."}
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post("/supply-demand/analyze", response_model=SupplyDemandResponse)
def supply_demand(payload: SupplyDemandRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return eng.analyze_supply_demand(
            db,
            payload.crop_id,
            payload.region_id,
            payload.farm_id,
            payload.expected_supply_kg,
            payload.market_id,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post("/schedule/cultivation", response_model=ScheduleResponse)
def schedule(payload: ScheduleRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return eng.schedule_cultivation(db, payload.farm_id, payload.crop_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.get("/risk/surplus")
def risk(
    crop_id: int,
    region_id: int,
    farm_id: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        return eng.surplus_risk(db, crop_id, region_id, farm_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post("/market/allocation")
def allocation(payload: AllocationRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return {"items": eng.allocate_markets(db, payload.farm_id, payload.crop_id, payload.quantity_kg)}
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post("/simulation/what-if", response_model=WhatIfResponse)
def what_if(payload: WhatIfRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return eng.what_if(db, user.id, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post("/vision/strawberry/detect", response_model=VisionResponse)
async def strawberry_detect(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Please upload an image file")
    data = await file.read()
    if len(data) > 8_000_000:
        raise HTTPException(400, "Image too large (max 8MB)")
    try:
        return detect_strawberries(data, settings.YOLO_WEIGHTS_PATH, settings.YOLO_CONFIDENCE)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(500, f"Vision module error: {exc}") from exc


@router.post("/admin/reseed")
def reseed(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.database.seed import seed_all
    from app.database.session import Base, engine
    from app import models  # noqa: F401

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_all(db)
    return {"ok": True, "message": "Database reseeded with DEMO DATA"}


@router.post("/admin/train-forecasts")
def train_forecasts(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.models.crop import Crop

    trained = []
    for crop in db.query(Crop).all():
        try:
            d = eng.forecast_demand(db, crop.id, None, None, 6)
            p = eng.forecast_price(db, crop.id, None, None, 6)
            trained.append({"crop": crop.name, "demand_metrics": d["metrics"], "price_metrics": p["metrics"]})
        except ValueError as exc:
            trained.append({"crop": crop.name, "error": str(exc)})
    return {"trained": trained, "disclaimer": "Metrics computed on validation holdout split."}
