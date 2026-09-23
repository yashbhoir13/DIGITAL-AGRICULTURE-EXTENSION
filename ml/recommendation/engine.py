"""Rule + score hybrid crop recommendation.

Agricultural suitability is scored from soil, water, season, and temperature.
Market suitability uses predicted demand, price, supply gap, perishability, and duration.
"""

from __future__ import annotations


def soil_match(crop_soil: str, farm_soil: str) -> float:
    c = crop_soil.lower()
    f = farm_soil.lower()
    if f in c or any(tok.strip() and tok.strip() in c for tok in f.replace(",", " ").split()):
        return 1.0
    if "loam" in c and "loam" in f:
        return 0.75
    return 0.35


def water_match(crop_need: str, farm_water: str) -> float:
    ranking = {"low": 1, "moderate": 2, "medium": 2, "high": 3, "very high": 4}
    need = ranking.get(crop_need.lower(), 2)
    have = ranking.get(farm_water.lower(), 2)
    if have >= need:
        return 1.0
    if have == need - 1:
        return 0.55
    return 0.2


def season_match(crop_season: str, farm_season: str) -> float:
    cs = crop_season.lower()
    fs = farm_season.lower()
    if fs in cs or "all" in cs:
        return 1.0
    return 0.4


def temp_match(tmin: float, tmax: float, region_temp: float) -> float:
    if tmin <= region_temp <= tmax:
        return 1.0
    if abs(region_temp - tmin) < 4 or abs(region_temp - tmax) < 4:
        return 0.6
    return 0.25


def agri_score(crop: dict, farm: dict, region: dict) -> tuple[float, list[str]]:
    reasons = []
    s = soil_match(crop["suitable_soil"], farm["soil_type"])
    w = water_match(crop["water_requirement"], farm["water_availability"])
    se = season_match(crop["suitable_season"], farm["season"])
    te = temp_match(crop["min_temp_c"], crop["max_temp_c"], region["avg_temp_c"])
    score = 100 * (0.3 * s + 0.25 * w + 0.25 * se + 0.2 * te)
    if s >= 0.75:
        reasons.append(f"Soil ({farm['soil_type']}) aligns with {crop['name']} requirements.")
    else:
        reasons.append(f"Soil match is only partial for {crop['name']}.")
    if w >= 0.75:
        reasons.append("On-farm water availability covers crop water need.")
    else:
        reasons.append("Water availability may constrain this crop.")
    if se >= 0.9:
        reasons.append(f"Season ({farm['season']}) is suitable.")
    if te >= 0.9:
        reasons.append("Regional temperature is within crop range.")
    return round(score, 2), reasons


def market_score(
    predicted_demand: float,
    expected_price: float,
    gap_kg: float,
    perishability: str,
    duration_days: int,
    capacity_kg: float,
) -> tuple[float, list[str]]:
    reasons = []
    demand_n = min(predicted_demand / 5000.0, 1.0)
    price_n = min(expected_price / 80.0, 1.0)
    # Positive gap (demand - supply) is good for the farmer
    gap_n = 0.5 + max(min(gap_kg / 4000.0, 0.5), -0.5)
    perish_pen = {"high": 0.55, "medium": 0.8, "low": 1.0}.get(perishability.lower(), 0.75)
    duration_n = 1.0 if duration_days <= 120 else 0.75 if duration_days <= 180 else 0.55
    cap_n = min(capacity_kg / 8000.0, 1.0)
    score = 100 * (0.28 * demand_n + 0.22 * price_n + 0.22 * gap_n + 0.12 * perish_pen + 0.08 * duration_n + 0.08 * cap_n)
    if gap_kg > 200:
        reasons.append("Market shows a demand surplus relative to expected local supply (shortage opportunity).")
    elif gap_kg < -200:
        reasons.append("Expected supply exceeds predicted demand — surplus/wastage risk.")
    else:
        reasons.append("Supply and demand appear roughly balanced.")
    reasons.append(f"Indicative price level ~ INR {expected_price:.1f}/kg (DEMO series).")
    if perishability.lower() == "high":
        reasons.append("High perishability increases storage and logistics risk.")
    return round(score, 2), reasons


def suitability_label(combined: float) -> str:
    if combined >= 72:
        return "High suitability"
    if combined >= 55:
        return "Medium suitability"
    return "Low suitability"
