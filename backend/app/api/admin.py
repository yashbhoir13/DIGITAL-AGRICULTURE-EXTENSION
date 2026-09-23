from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database.session import get_db
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.market import Market, MarketDemand
from app.models.region import Region
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return {
        "users": db.query(User).count(),
        "crops": db.query(Crop).count(),
        "regions": db.query(Region).count(),
        "markets": db.query(Market).count(),
        "farms": db.query(Farm).count(),
        "demand_points": db.query(MarketDemand).count(),
        "status": "operational",
        "data_label": "Real-world APMC Mandi Benchmark rates updated",
    }


@router.post("/reseed")
def trigger_reseed(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from app.database.seed import reseed_all
    reseed_all(db)
    return {"status": "success", "message": "Database successfully reseeded with real-world APMC vegetable & fruit market benchmarks."}

