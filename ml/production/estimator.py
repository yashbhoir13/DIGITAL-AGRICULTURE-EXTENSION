"""Production estimation.

If regional yield observations exist, a small Ridge model estimates kg/ha from
area and regional climate. Otherwise expected_yield_kg_per_ha from the crop table
is scaled by simple agro-condition factors.
"""

from __future__ import annotations

import numpy as np
from sklearn.linear_model import Ridge

from ml.evaluation.metrics import regression_metrics


def estimate_production(
    land_area_ha: float,
    crop_yield_kg_ha: float,
    water: str,
    soil_ph: float | None,
    region_temp: float | None,
    crop_tmin: float,
    crop_tmax: float,
    observed_pairs: list[tuple[float, float]] | None = None,
) -> dict:
    water_f = {"low": 0.78, "moderate": 0.92, "medium": 0.92, "high": 1.0, "very high": 1.02}.get(water.lower(), 0.9)
    ph_f = 1.0
    if soil_ph is not None:
        if 6.0 <= soil_ph <= 7.5:
            ph_f = 1.0
        elif 5.5 <= soil_ph <= 8.0:
            ph_f = 0.92
        else:
            ph_f = 0.8
    temp_f = 1.0
    if region_temp is not None:
        if crop_tmin <= region_temp <= crop_tmax:
            temp_f = 1.0
        else:
            temp_f = 0.85

    method = "rule-based yield × area (crop table + agro factors)"
    metrics = {}
    yield_hat = crop_yield_kg_ha * water_f * ph_f * temp_f

    if observed_pairs and len(observed_pairs) >= 8:
        X = np.array([[a] for a, _p in observed_pairs], dtype=float)
        y = np.array([p / max(a, 1e-6) for a, p in observed_pairs], dtype=float)
        split = int(len(X) * 0.8)
        model = Ridge(alpha=1.0)
        model.fit(X[:split], y[:split])
        if len(X) - split >= 2:
            pred = model.predict(X[split:])
            metrics = regression_metrics(y[split:], pred)
        ml_yield = float(model.predict([[land_area_ha]])[0])
        yield_hat = 0.5 * yield_hat + 0.5 * max(ml_yield, 0)
        method = "blend: crop-table factors + Ridge on DEMO regional yields"

    expected = max(0.0, land_area_ha * yield_hat)
    return {
        "yield_kg_per_ha": round(yield_hat, 2),
        "expected_production_kg": round(expected, 2),
        "method": method,
        "metrics": metrics,
        "notes": "DEMO estimation — not a guaranteed farmer yield.",
    }
