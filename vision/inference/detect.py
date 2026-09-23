"""Strawberry detection module.

CURRENTLY IMPLEMENTED:
- Ultralytics YOLO inference when custom weights exist at vision/weights/best.pt
- Labelled DEMO HSV colour heuristic fallback when weights are missing

Do NOT treat heuristic detections as YOLO accuracy. No fabricated mAP is reported.
"""

from __future__ import annotations

import base64
from pathlib import Path

import cv2
import numpy as np

WEIGHTS = Path(__file__).resolve().parents[1] / "weights" / "best.pt"


def _encode_image(img_bgr: np.ndarray) -> str:
    ok, buf = cv2.imencode(".jpg", img_bgr)
    if not ok:
        raise ValueError("Could not encode annotated image")
    return base64.b64encode(buf.tobytes()).decode("ascii")


def _heuristic_detect(img_bgr: np.ndarray, conf_floor: float = 0.55) -> list[dict]:
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    # Red strawberry-like hues (DEMO heuristic)
    mask1 = cv2.inRange(hsv, (0, 80, 60), (10, 255, 255))
    mask2 = cv2.inRange(hsv, (160, 80, 60), (179, 255, 255))
    mask = cv2.bitwise_or(mask1, mask2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    h, w = img_bgr.shape[:2]
    min_area = (h * w) * 0.0015
    detections = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        x, y, bw, bh = cv2.boundingRect(cnt)
        conf = float(min(0.95, 0.55 + area / (h * w)))
        if conf < conf_floor:
            continue
        detections.append(
            {
                "label": "Strawberry",
                "confidence": round(conf, 3),
                "bbox": [float(x), float(y), float(x + bw), float(y + bh)],
            }
        )
    return detections


def _yolo_detect(img_bgr: np.ndarray, weights: Path, confidence: float) -> list[dict]:
    from ultralytics import YOLO

    model = YOLO(str(weights))
    results = model.predict(source=img_bgr, conf=confidence, verbose=False)
    detections = []
    for r in results:
        names = r.names
        if r.boxes is None:
            continue
        for box in r.boxes:
            xyxy = box.xyxy[0].tolist()
            cls_id = int(box.cls[0])
            label = names.get(cls_id, str(cls_id))
            detections.append(
                {
                    "label": label,
                    "confidence": round(float(box.conf[0]), 3),
                    "bbox": [float(v) for v in xyxy],
                }
            )
    return detections


def detect_strawberries(image_bytes: bytes, weights_path: str | None = None, confidence: float = 0.25) -> dict:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image upload")

    weights = Path(weights_path) if weights_path else WEIGHTS
    if not weights.is_absolute():
        weights = (Path(__file__).resolve().parents[2] / weights).resolve() if "vision" not in str(weights) else weights

    # Prefer project weights path
    candidates = [
        Path(weights_path) if weights_path else None,
        WEIGHTS,
        Path(__file__).resolve().parents[2] / "vision" / "weights" / "best.pt",
    ]
    chosen = next((p for p in candidates if p and Path(p).exists()), None)

    if chosen:
        try:
            detections = _yolo_detect(img, Path(chosen), confidence)
            engine = f"YOLO/Ultralytics ({Path(chosen).name})"
            notes = "Inference from local weights. Metrics are not fabricated; evaluate via vision/training scripts."
        except Exception as exc:  # noqa: BLE001
            detections = _heuristic_detect(img)
            engine = "DEMO HSV heuristic (YOLO load failed)"
            notes = f"YOLO weights present but load/inference failed ({exc}). Fallback is a labelled DEMO heuristic — not YOLO accuracy."
    else:
        detections = _heuristic_detect(img)
        engine = "DEMO HSV colour heuristic"
        notes = (
            "Custom YOLO weights not found at vision/weights/best.pt. "
            "Using a labelled DEMO colour heuristic for prototype demonstration. "
            "Place trained Ultralytics weights to enable YOLO inference."
        )

    annotated = img.copy()
    for det in detections:
        x1, y1, x2, y2 = map(int, det["bbox"])
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (40, 180, 40), 2)
        cv2.putText(
            annotated,
            f"{det['label']}: {det['confidence']:.2f}",
            (x1, max(20, y1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (20, 140, 20),
            2,
            cv2.LINE_AA,
        )

    return {
        "engine": engine,
        "count": len(detections),
        "detections": detections,
        "annotated_image_base64": _encode_image(annotated),
        "notes": notes,
    }
