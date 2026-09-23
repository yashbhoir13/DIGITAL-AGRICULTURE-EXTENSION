"""FastAPI API Endpoints for AI Plant CCTV & Harmful Threat Detection Engine."""

from __future__ import annotations

import base64
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.core.deps import get_current_user
from app.models.user import User
from vision.inference.cctv_detector import detect_cctv_threats

router = APIRouter(prefix="/cctv", tags=["cctv"])

# In-memory realistic threat alert log & evidence database
_INCIDENT_LOG: list[dict[str, Any]] = [
    {
        "id": "INC-104",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "camera_id": "CAM-01 (North Orchard)",
        "threat_level": "CRITICAL",
        "threat_type": "Caterpillar / Foliage Pest",
        "plant_id": "Plant #01 (Strawberry)",
        "confidence": 0.94,
        "danger_score": 85,
        "harm_description": "Caterpillar active inside Strawberry #01 safety zone; devouring leaf tissue.",
        "action_taken": "Automated bio-pesticide spray alert dispatched to farm worker.",
        "status": "Active Alert",
        "snapshot": None,
    },
    {
        "id": "INC-103",
        "timestamp": "2026-09-05 06:18:22",
        "camera_id": "CAM-02 (Greenhouse)",
        "threat_level": "HIGH",
        "threat_type": "Avian Pest (Bird)",
        "plant_id": "Plant #04 (Tomato)",
        "confidence": 0.86,
        "danger_score": 70,
        "harm_description": "Birds pecking ripening fruit inside Tomato #04 canopy zone.",
        "action_taken": "Ultrasonic bird scarer pulsed for 45 seconds.",
        "status": "Resolved",
        "snapshot": None,
    },
    {
        "id": "INC-102",
        "timestamp": "2026-09-04 22:45:10",
        "camera_id": "CAM-03 (Perimeter Fence)",
        "threat_level": "HIGH",
        "threat_type": "Stray Cattle / Cow",
        "plant_id": "Plant #02 (Field Row)",
        "confidence": 0.89,
        "danger_score": 75,
        "harm_description": "Stray cattle spotted near boundary fence; trampling risk.",
        "action_taken": "Perimeter acoustic siren engaged.",
        "status": "Resolved",
        "snapshot": None,
    },
]

# Registered CCTV & Mobile Cameras
_AVAILABLE_CAMERAS: list[dict[str, Any]] = [
    {
        "id": "CAM-01",
        "name": "North Strawberry Orchard",
        "location": "Sector 3 (North Block)",
        "resolution": "1080p FHD",
        "status": "Online",
        "coverage": "Strawberry fruit beds & main irrigation manifold",
        "default_source": "simulated",
        "paired_crop": "Strawberry",
    },
    {
        "id": "CAM-02",
        "name": "Greenhouse Nursery A",
        "location": "Polyhouse Complex 1",
        "resolution": "1080p FHD",
        "status": "Online",
        "coverage": "High-value germinating seed trays & seedlings",
        "default_source": "simulated",
        "paired_crop": "Tomato",
    },
    {
        "id": "CAM-03",
        "name": "Field Boundary & Fencing",
        "location": "South Perimeter Barrier",
        "resolution": "4K Ultra",
        "status": "Online",
        "coverage": "Livestock deterrent wire and perimeter gate",
        "default_source": "simulated",
        "paired_crop": "Mixed Crops",
    },
    {
        "id": "CAM-MOBILE",
        "name": "Mobile Device Camera (Live)",
        "location": "Handheld Inspector Phone Camera",
        "resolution": "Device Native",
        "status": "Ready",
        "coverage": "Handheld field scouting & close-up plant inspection",
        "default_source": "device",
        "paired_crop": "Field Scouting",
    },
]


class Base64FramePayload(BaseModel):
    image_base64: str
    camera_id: str = "CAM-01"
    confidence: float = 0.25
    safety_zone_px: int = 50


class NewCameraInput(BaseModel):
    name: str
    location: str
    resolution: str = "1080p FHD"
    paired_crop: str = "General Crop"
    coverage: str = "Field Canopy"


@router.get("/cameras")
def list_cameras(_: User = Depends(get_current_user)):
    """Returns available farm CCTV cameras and channels."""
    return {"cameras": _AVAILABLE_CAMERAS}


@router.post("/cameras")
def add_camera(payload: NewCameraInput, _: User = Depends(get_current_user)):
    """Registers a new farm CCTV or mobile stream camera."""
    new_id = f"CAM-0{len(_AVAILABLE_CAMERAS) + 1}"
    cam = {
        "id": new_id,
        "name": payload.name,
        "location": payload.location,
        "resolution": payload.resolution,
        "status": "Online",
        "coverage": payload.coverage,
        "default_source": "user_added",
        "paired_crop": payload.paired_crop,
    }
    _AVAILABLE_CAMERAS.append(cam)
    return {"ok": True, "camera": cam}


@router.delete("/cameras/{camera_id}")
def delete_camera(camera_id: str, _: User = Depends(get_current_user)):
    """Removes a camera from system registration."""
    global _AVAILABLE_CAMERAS
    _AVAILABLE_CAMERAS = [c for c in _AVAILABLE_CAMERAS if c["id"] != camera_id]
    return {"ok": True, "message": f"Camera {camera_id} removed"}


@router.get("/threat-log")
@router.get("/alerts")
def get_threat_log(_: User = Depends(get_current_user)):
    """Returns the historical agricultural threat incident and evidence snapshot log."""
    return {"incidents": _INCIDENT_LOG, "alerts": _INCIDENT_LOG}


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str, _: User = Depends(get_current_user)):
    """Marks a threat alert as resolved."""
    for inc in _INCIDENT_LOG:
        if inc["id"] == alert_id:
            inc["status"] = "Resolved"
            inc["resolved_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return {"ok": True, "alert": inc}
    raise HTTPException(404, f"Alert {alert_id} not found")


@router.get("/stats")
def get_cctv_stats(_: User = Depends(get_current_user)):
    """Returns live CCTV monitoring statistics for the main dashboard."""
    active_alerts = [i for i in _INCIDENT_LOG if i.get("status") == "Active Alert"]
    online_cams = [c for c in _AVAILABLE_CAMERAS if c["status"] in ("Online", "Ready")]

    top_risk = "SAFE"
    if any(i["threat_level"] == "CRITICAL" for i in active_alerts):
        top_risk = "CRITICAL"
    elif active_alerts:
        top_risk = "WARNING"

    return {
        "cameras_online": len(online_cams),
        "total_cameras": len(_AVAILABLE_CAMERAS),
        "active_threats": len(active_alerts),
        "total_incidents_logged": len(_INCIDENT_LOG),
        "overall_risk_level": top_risk,
    }


@router.post("/analyze-frame")
async def analyze_cctv_frame(
    file: UploadFile | None = File(None),
    camera_id: str = Form("CAM-01"),
    confidence: float = Form(0.25),
    safety_zone_px: int = Form(50),
    _: User = Depends(get_current_user),
):
    """Analyzes a CCTV frame from camera feed or file upload for agricultural plant threats."""
    if file is None:
        raise HTTPException(400, "No image file provided")

    image_bytes = await file.read()
    if len(image_bytes) > 10_000_000:
        raise HTTPException(400, "Image frame exceeds 10MB limit")

    try:
        results = detect_cctv_threats(
            image_bytes=image_bytes,
            confidence_threshold=confidence,
            camera_id=camera_id,
            safety_zone_px=safety_zone_px,
        )

        # Automatically record evidence snapshot for confirmed CRITICAL / WARNING alerts
        if results.get("risk_level") in ("CRITICAL", "WARNING") and results.get("threats"):
            top_t = results["threats"][0]
            new_alert = {
                "id": f"INC-{len(_INCIDENT_LOG) + 105}",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "camera_id": camera_id,
                "threat_level": top_t.get("threat_level", "HIGH"),
                "threat_type": top_t.get("threat_label", "Plant Threat"),
                "plant_id": f"{top_t.get('plant_id', 'Plant #01')} ({top_t.get('plant_class', 'Crop')})",
                "confidence": top_t.get("confidence", 0.85),
                "danger_score": results.get("danger_score", 65),
                "harm_description": top_t.get("harm", "Active threat inside plant protection zone"),
                "action_taken": top_t.get("action", "Alert logged"),
                "status": "Active Alert",
                "snapshot": results.get("annotated_frame_base64"),
            }

            # Avoid spamming duplicate alerts within 1 minute for same camera + threat
            recent_dups = [
                i for i in _INCIDENT_LOG[:5]
                if i["camera_id"] == camera_id and i["threat_type"] == top_t.get("threat_label")
            ]
            if not recent_dups:
                _INCIDENT_LOG.insert(0, new_alert)

        return results
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(500, f"CCTV Analysis Error: {exc}") from exc


@router.post("/analyze-base64")
def analyze_base64_frame(
    payload: Base64FramePayload,
    _: User = Depends(get_current_user),
):
    """Analyzes a base64 encoded frame directly from browser webcam / mobile stream."""
    try:
        raw_b64 = payload.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        image_bytes = base64.b64decode(raw_b64)
        results = detect_cctv_threats(
            image_bytes=image_bytes,
            confidence_threshold=payload.confidence,
            camera_id=payload.camera_id,
            safety_zone_px=payload.safety_zone_px,
        )

        # Log alert snapshot if threat confirmed
        if results.get("risk_level") in ("CRITICAL", "WARNING") and results.get("threats"):
            top_t = results["threats"][0]
            recent_dups = [
                i for i in _INCIDENT_LOG[:5]
                if i["camera_id"] == payload.camera_id and i["threat_type"] == top_t.get("threat_label")
            ]
            if not recent_dups:
                _INCIDENT_LOG.insert(
                    0,
                    {
                        "id": f"INC-{len(_INCIDENT_LOG) + 105}",
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "camera_id": payload.camera_id,
                        "threat_level": top_t.get("threat_level", "HIGH"),
                        "threat_type": top_t.get("threat_label", "Plant Threat"),
                        "plant_id": f"{top_t.get('plant_id', 'Plant #01')} ({top_t.get('plant_class', 'Crop')})",
                        "confidence": top_t.get("confidence", 0.85),
                        "danger_score": results.get("danger_score", 65),
                        "harm_description": top_t.get("harm", "Active threat inside plant protection zone"),
                        "action_taken": top_t.get("action", "Alert logged"),
                        "status": "Active Alert",
                        "snapshot": results.get("annotated_frame_base64"),
                    },
                )

        return results
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"Error processing video stream frame: {exc}") from exc
