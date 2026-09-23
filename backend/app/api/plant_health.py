"""Plant Health & Disease Prediction API Endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.plant_health import PlantHealthScan
from app.models.user import User
from app.services.plant_health_service import predict_plant_health

router = APIRouter(prefix="/plant-health", tags=["plant-health"])

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/predict")
async def predict_plant_health_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyzes an uploaded or camera-captured plant image for health and disease diagnosis."""
    # 1. Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file.content_type}'. Allowed types: image/jpeg, image/png, image/webp.",
        )

    # 2. Read and validate file size (max 10 MB)
    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image file is empty.",
        )

    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds the 10 MB size limit. Please upload a smaller image.",
        )

    # 3. Perform ML inference / development analysis
    try:
        result = predict_plant_health(image_bytes, filename=file.filename or "")
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing the plant image. Please try again.",
        )

    # 4. Save scan record to database history
    scan = PlantHealthScan(
        user_id=current_user.id,
        plant_name=result.get("plant", "Unknown"),
        status=result.get("status", "Unknown"),
        disease=result.get("disease"),
        confidence=result.get("confidence", 0.0),
        recommendation=result.get("recommendation"),
        mode=result.get("mode", "mock"),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # 5. Format return JSON
    response_data = {
        "success": True,
        "plant": scan.plant_name,
        "status": scan.status,
        "disease": scan.disease,
        "confidence": scan.confidence,
        "recommendation": scan.recommendation,
        "scan_id": scan.id,
        "mode": scan.mode,
        "created_at": scan.created_at.isoformat() if scan.created_at else None,
    }
    if "note" in result:
        response_data["note"] = result["note"]

    return response_data


@router.get("/history")
def get_plant_health_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves recent plant health scans for the authenticated user."""
    scans = (
        db.query(PlantHealthScan)
        .filter(PlantHealthScan.user_id == current_user.id)
        .order_by(PlantHealthScan.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "scans": [
            {
                "id": s.id,
                "plant_name": s.plant_name,
                "status": s.status,
                "disease": s.disease,
                "confidence": s.confidence,
                "recommendation": s.recommendation,
                "mode": s.mode,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in scans
        ]
    }
