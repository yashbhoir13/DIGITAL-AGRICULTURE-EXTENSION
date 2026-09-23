from __future__ import annotations

import sys
from calendar import month_name
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy import func
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml.forecasting.baseline import train_and_forecast
from ml.production.estimator import estimate_production
from ml.recommendation.engine import agri_score, market_score, suitability_label

from app.models.agri_data import AgriculturalData
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.intelligence import (
    CultivationPlan,
    HarvestSchedule,
    MarketAllocation,
    Recommendation,
    RiskAnalysis,
    SupplyDemandAnalysis,
    WhatIfScenario,
)
from app.models.market import LogisticsData, Market, MarketDemand, MarketPrice
from app.models.region import Region


def _agg_demand_series(db: Session, crop_id: int, region_id: int | None = None, market_id: int | None = None):
    q = db.query(MarketDemand.period_date, func.avg(MarketDemand.demand_kg).label("v")).filter(
        MarketDemand.crop_id == crop_id
    )
    if market_id:
        q = q.filter(MarketDemand.market_id == market_id)
    elif region_id:
        market_ids = [m.id for m in db.query(Market).filter(Market.region_id == region_id).all()]
        if market_ids:
            q = q.filter(MarketDemand.market_id.in_(market_ids))
    rows = q.group_by(MarketDemand.period_date).order_by(MarketDemand.period_date).all()
    return [r.period_date for r in rows], [float(r.v) for r in rows]


def _agg_price_series(db: Session, crop_id: int, market_id: int | None = None, region_id: int | None = None):
    q = db.query(MarketPrice.period_date, func.avg(MarketPrice.price_inr_per_kg).label("v")).filter(
        MarketPrice.crop_id == crop_id
    )
    if market_id:
        q = q.filter(MarketPrice.market_id == market_id)
    elif region_id:
        market_ids = [m.id for m in db.query(Market).filter(Market.region_id == region_id).all()]
        if market_ids:
            q = q.filter(MarketPrice.market_id.in_(market_ids))
    rows = q.group_by(MarketPrice.period_date).order_by(MarketPrice.period_date).all()
    return [r.period_date for r in rows], [float(r.v) for r in rows]


def forecast_demand(db: Session, crop_id: int, region_id: int | None, market_id: int | None, horizon: int = 6) -> dict:
    crop = db.query(Crop).get(crop_id)
    if not crop:
        raise ValueError("Crop not found")
    dates, values = _agg_demand_series(db, crop_id, region_id, market_id)
    if len(dates) < 10:
        raise ValueError("Insufficient demand history for forecasting")
    result = train_and_forecast(dates, values, horizon=horizon, model_key=f"demand_c{crop_id}")
    return {
        "crop_id": crop.id,
        "crop_name": crop.name,
        "region_id": region_id,
        "market_id": market_id,
        "model_name": result["model_name"],
        "horizon_months": horizon,
        "historical": [{"period_date": h["period_date"], "value": h["value"], "kind": "historical"} for h in result["historical"]],
        "forecast": [{"period_date": f["period_date"], "value": f["value"], "kind": "forecast"} for f in result["forecast"]],
        "metrics": result["metrics"],
    }


def forecast_price(db: Session, crop_id: int, region_id: int | None, market_id: int | None, horizon: int = 6) -> dict:
    crop = db.query(Crop).get(crop_id)
    if not crop:
        raise ValueError("Crop not found")
    dates, values = _agg_price_series(db, crop_id, market_id, region_id)
    if len(dates) < 10:
        raise ValueError("Insufficient price history for forecasting")
    result = train_and_forecast(dates, values, horizon=horizon, model_key=f"price_c{crop_id}")
    trend = "rising" if result["forecast"][-1]["value"] > result["historical"][-1]["value"] else "softening"
    return {
        "crop_id": crop.id,
        "crop_name": crop.name,
        "region_id": region_id,
        "market_id": market_id,
        "model_name": result["model_name"],
        "horizon_months": horizon,
        "price_trend": trend,
        "historical": [{"period_date": h["period_date"], "value": h["value"], "kind": "historical"} for h in result["historical"]],
        "forecast": [{"period_date": f["period_date"], "value": f["value"], "kind": "forecast"} for f in result["forecast"]],
        "metrics": result["metrics"],
    }


def production_estimate(db: Session, crop_id: int, farm_id: int | None, land_area_ha: float | None, region_id: int | None) -> dict:
    crop = db.query(Crop).get(crop_id)
    if not crop:
        raise ValueError("Crop not found")
    farm = db.query(Farm).get(farm_id) if farm_id else None
    area = land_area_ha or (farm.land_area_ha if farm else None)
    if not area:
        raise ValueError("land_area_ha or farm_id required")
    region = None
    if farm:
        region = db.query(Region).get(farm.region_id)
    elif region_id:
        region = db.query(Region).get(region_id)
    soil_ph = farm.soil.ph if farm and farm.soil else None
    water = farm.water_availability if farm else "moderate"
    region_temp = region.avg_temp_c if region else None
    rid = region.id if region else None
    observed = []
    if rid:
        for row in db.query(AgriculturalData).filter(AgriculturalData.region_id == rid, AgriculturalData.crop_id == crop_id).all():
            observed.append((float(row.area_ha), float(row.production_kg)))
    est = estimate_production(
        land_area_ha=area,
        crop_yield_kg_ha=crop.expected_yield_kg_per_ha,
        water=water,
        soil_ph=soil_ph,
        region_temp=region_temp,
        crop_tmin=crop.min_temp_c,
        crop_tmax=crop.max_temp_c,
        observed_pairs=observed,
    )
    return {
        "crop_id": crop.id,
        "crop_name": crop.name,
        "land_area_ha": area,
        "yield_kg_per_ha": est["yield_kg_per_ha"],
        "expected_production_kg": est["expected_production_kg"],
        "method": est["method"],
        "notes": est["notes"],
    }


def recommend_crops(db: Session, farm_id: int) -> list[dict]:
    farm = db.query(Farm).get(farm_id)
    if not farm or not farm.soil:
        raise ValueError("Farm with soil profile required")
    region = db.query(Region).get(farm.region_id)
    crops = db.query(Crop).all()
    farm_dict = {
        "soil_type": farm.soil.soil_type,
        "water_availability": farm.water_availability,
        "season": farm.season,
    }
    region_dict = {"avg_temp_c": region.avg_temp_c}
    ranked = []
    # Use recent historical averages for ranking speed; dedicated forecast endpoints run ML.
    market_ids = [m.id for m in db.query(Market).filter(Market.region_id == region.id).all()]
    for crop in crops:
        a_score, a_reasons = agri_score(
            {
                "name": crop.name,
                "suitable_soil": crop.suitable_soil,
                "water_requirement": crop.water_requirement,
                "suitable_season": crop.suitable_season,
                "min_temp_c": crop.min_temp_c,
                "max_temp_c": crop.max_temp_c,
            },
            farm_dict,
            region_dict,
        )
        dq = db.query(func.avg(MarketDemand.demand_kg)).filter(MarketDemand.crop_id == crop.id)
        pq = db.query(func.avg(MarketPrice.price_inr_per_kg)).filter(MarketPrice.crop_id == crop.id)
        if market_ids:
            dq = dq.filter(MarketDemand.market_id.in_(market_ids))
            pq = pq.filter(MarketPrice.market_id.in_(market_ids))
        predicted_demand = float(dq.scalar() or 1000.0)
        expected_price = float(pq.scalar() or 25.0)
        # Light production estimate without nested ML blend for ranking
        yield_hat = crop.expected_yield_kg_per_ha
        expected_prod = farm.land_area_ha * yield_hat
        gap = predicted_demand - expected_prod
        markets = db.query(Market).filter(Market.region_id == region.id).all()
        capacity = sum(m.capacity_kg for m in markets) if markets else 5000
        m_score, m_reasons = market_score(
            predicted_demand, expected_price, gap, crop.perishability, crop.cultivation_days, capacity
        )
        m_reasons.append("Market score uses recent historical averages; open Demand/Price Forecast for ML projections.")
        combined = round(0.5 * a_score + 0.5 * m_score, 2)
        ranked.append(
            {
                "crop_id": crop.id,
                "crop_name": crop.name,
                "agri_score": a_score,
                "market_score": m_score,
                "combined_score": combined,
                "suitability": suitability_label(combined),
                "reasons": a_reasons + m_reasons,
            }
        )
    ranked.sort(key=lambda x: x["combined_score"], reverse=True)
    db.query(Recommendation).filter(Recommendation.farm_id == farm_id).delete()
    for i, item in enumerate(ranked, start=1):
        item["rank"] = i
        db.add(
            Recommendation(
                farm_id=farm_id,
                crop_id=item["crop_id"],
                rank=i,
                suitability=item["suitability"],
                agri_score=item["agri_score"],
                market_score=item["market_score"],
                combined_score=item["combined_score"],
                reasons="; ".join(item["reasons"]),
            )
        )
    db.commit()
    return ranked


def analyze_supply_demand(
    db: Session,
    crop_id: int,
    region_id: int,
    farm_id: int | None = None,
    expected_supply_kg: float | None = None,
    market_id: int | None = None,
) -> dict:
    crop = db.query(Crop).get(crop_id)
    if not crop:
        raise ValueError("Crop not found")
    if expected_supply_kg is None:
        if farm_id:
            expected_supply_kg = production_estimate(db, crop_id, farm_id, None, region_id)["expected_production_kg"]
        else:
            expected_supply_kg = crop.expected_yield_kg_per_ha * 1.0
    d_fc = forecast_demand(db, crop_id, region_id, market_id, horizon=3)
    predicted_demand = sum(p["value"] for p in d_fc["forecast"]) / max(len(d_fc["forecast"]), 1)
    gap = predicted_demand - expected_supply_kg
    ratio = abs(gap) / max(predicted_demand, 1)
    if gap > predicted_demand * 0.1:
        status, risk = "Shortage", "Medium Risk" if ratio < 0.35 else "High Risk"
    elif gap < -predicted_demand * 0.1:
        status, risk = "Surplus", "Medium Risk" if ratio < 0.35 else "High Risk"
    else:
        status, risk = "Balanced", "Low Risk"
    explanation = (
        f"Expected supply {expected_supply_kg:.0f} kg vs predicted demand {predicted_demand:.0f} kg "
        f"(gap {gap:.0f} kg). Status: {status}."
    )
    row = SupplyDemandAnalysis(
        crop_id=crop_id,
        region_id=region_id,
        market_id=market_id,
        expected_supply_kg=expected_supply_kg,
        predicted_demand_kg=predicted_demand,
        gap_kg=gap,
        status=status,
        risk_level=risk,
    )
    db.add(row)
    db.commit()
    return {
        "crop_id": crop.id,
        "crop_name": crop.name,
        "region_id": region_id,
        "expected_supply_kg": round(expected_supply_kg, 2),
        "predicted_demand_kg": round(predicted_demand, 2),
        "gap_kg": round(gap, 2),
        "status": status,
        "risk_level": risk,
        "explanation": explanation,
    }


def schedule_cultivation(db: Session, farm_id: int, crop_id: int) -> dict:
    farm = db.query(Farm).get(farm_id)
    crop = db.query(Crop).get(crop_id)
    if not farm or not crop:
        raise ValueError("Farm or crop not found")
    d_fc = forecast_demand(db, crop_id, farm.region_id, None, horizon=6)
    peak = max(d_fc["forecast"], key=lambda x: x["value"])
    peak_date = peak["period_date"]
    start = peak_date - timedelta(days=crop.cultivation_days)
    harvest = peak_date
    notes = (
        f"Align harvest with predicted high-demand period around {month_name[peak_date.month]}. "
        f"Crop duration {crop.cultivation_days} days."
    )
    plan = CultivationPlan(
        farm_id=farm_id,
        crop_id=crop_id,
        recommended_start=start,
        expected_harvest=harvest,
        demand_peak_month=peak_date.month,
        notes=notes,
    )
    db.add(plan)
    db.flush()
    milestones = [
        ("Land preparation", start - timedelta(days=14), "Prepare beds / soil amendments"),
        ("Cultivation start", start, "Sowing / transplanting window"),
        ("Mid-season care", start + timedelta(days=crop.cultivation_days // 2), "Irrigation & pest monitoring"),
        ("Expected harvest", harvest, "Target market demand window"),
    ]
    out_ms = []
    for name, dt, detail in milestones:
        db.add(HarvestSchedule(cultivation_plan_id=plan.id, milestone=name, milestone_date=dt, detail=detail))
        out_ms.append({"milestone": name, "milestone_date": dt, "detail": detail})
    db.commit()
    return {
        "crop_name": crop.name,
        "recommended_start": start,
        "expected_harvest": harvest,
        "demand_peak_month": peak_date.month,
        "demand_peak_label": month_name[peak_date.month],
        "notes": notes,
        "milestones": out_ms,
    }


def surplus_risk(db: Session, crop_id: int, region_id: int, farm_id: int | None = None) -> dict:
    crop = db.query(Crop).get(crop_id)
    sd = analyze_supply_demand(db, crop_id, region_id, farm_id)
    reasons = [sd["explanation"]]
    score = 30.0
    if sd["status"] == "Surplus":
        score += 35
        reasons.append("Supply exceeds predicted demand.")
    if crop.perishability.lower() == "high":
        score += 20
        reasons.append("High perishability increases wastage risk if unsold.")
    elif crop.perishability.lower() == "medium":
        score += 10
    markets = db.query(Market).filter(Market.region_id == region_id).all()
    if markets and not any(m.storage_available for m in markets):
        score += 15
        reasons.append("Limited local storage availability.")
    logistics = (
        db.query(LogisticsData)
        .filter(LogisticsData.region_id == region_id)
        .order_by(LogisticsData.distance_km.asc())
        .first()
    )
    if logistics and logistics.feasibility == "low":
        score += 15
        reasons.append("Transport feasibility is low for nearest markets.")
    score = min(score, 100)
    level = "LOW RISK" if score < 40 else "MEDIUM RISK" if score < 70 else "HIGH RISK"
    db.add(RiskAnalysis(crop_id=crop_id, region_id=region_id, risk_score=score, risk_level=level, reasons="; ".join(reasons)))
    db.commit()
    return {
        "crop_id": crop_id,
        "crop_name": crop.name,
        "region_id": region_id,
        "risk_score": round(score, 1),
        "risk_level": level,
        "reasons": reasons,
    }


def allocate_markets(db: Session, farm_id: int, crop_id: int, quantity_kg: float | None = None) -> list[dict]:
    farm = db.query(Farm).get(farm_id)
    crop = db.query(Crop).get(crop_id)
    if not farm or not crop:
        raise ValueError("Farm or crop not found")
    qty = quantity_kg or production_estimate(db, crop_id, farm_id, None, farm.region_id)["expected_production_kg"]
    markets = db.query(Market).all()
    results = []
    remaining = qty
    for market in markets:
        demand = float(
            db.query(func.avg(MarketDemand.demand_kg))
            .filter(MarketDemand.market_id == market.id, MarketDemand.crop_id == crop_id)
            .scalar()
            or market.current_demand_kg
        )
        price = float(
            db.query(func.avg(MarketPrice.price_inr_per_kg))
            .filter(MarketPrice.market_id == market.id, MarketPrice.crop_id == crop_id)
            .scalar()
            or market.current_price_inr
        )
        log = (
            db.query(LogisticsData)
            .filter(LogisticsData.market_id == market.id, LogisticsData.region_id == farm.region_id)
            .first()
        )
        dist = log.distance_km if log else 500
        cost = log.transport_cost_per_kg if log else 5
        feas = {"high": 1.0, "medium": 0.7, "low": 0.35}.get((log.feasibility if log else market.transport_feasibility).lower(), 0.5)
        absorb = min(market.capacity_kg * 0.4, demand)
        perish_pen = {"high": 0.7, "medium": 0.85, "low": 1.0}.get(crop.perishability.lower(), 0.8)
        storage = 1.0 if market.storage_available or crop.perishability.lower() == "low" else 0.55
        score = (
            0.3 * min(absorb / max(qty, 1), 1)
            + 0.25 * min(price / 80, 1)
            + 0.2 * feas
            + 0.15 * max(0, 1 - dist / 1000)
            + 0.1 * storage * perish_pen
            - 0.05 * min(cost / 10, 1)
        ) * 100
        reasons = [
            f"Predicted absorbable demand ~ {absorb:.0f} kg",
            f"Indicative price ~ INR {price:.1f}/kg",
            f"Distance ~ {dist:.0f} km (Regional logistics)",
            f"Transport feasibility: {log.feasibility if log else market.transport_feasibility}",
        ]
        if market.region_id == farm.region_id:
            reasons.append("Local market preference for reduced transit time.")
        results.append(
            {
                "market_id": market.id,
                "market_name": market.name,
                "score": round(score, 2),
                "absorb": absorb,
                "distance_km": dist,
                "reasons": reasons,
            }
        )
    results.sort(key=lambda x: x["score"], reverse=True)
    out = []
    db.query(MarketAllocation).filter(MarketAllocation.farm_id == farm_id, MarketAllocation.crop_id == crop_id).delete()
    for i, item in enumerate(results, start=1):
        alloc = min(remaining, item["absorb"]) if remaining > 0 else 0
        remaining = max(0, remaining - alloc)
        label = "Recommended" if i == 1 else "Alternative" if i <= 3 else "Low suitability"
        if i > 1 and item["absorb"] > 0 and results[0]["absorb"] < qty:
            label = "Alternative (surplus absorption)"
        payload = {
            "market_id": item["market_id"],
            "market_name": item["market_name"],
            "rank": i,
            "label": label,
            "score": item["score"],
            "allocated_kg": round(alloc, 2),
            "distance_km": item["distance_km"],
            "reasons": item["reasons"],
        }
        out.append(payload)
        db.add(
            MarketAllocation(
                farm_id=farm_id,
                crop_id=crop_id,
                market_id=item["market_id"],
                rank=i,
                label=label,
                score=item["score"],
                allocated_kg=alloc,
                reasons="; ".join(item["reasons"]),
            )
        )
    db.commit()
    return out


def what_if(db: Session, user_id: int, payload: dict) -> dict:
    farm = db.query(Farm).get(payload["farm_id"])
    crop = db.query(Crop).get(payload["crop_id"])
    if not farm or not crop:
        raise ValueError("Farm or crop not found")
    before_prod = production_estimate(db, crop.id, farm.id, None, farm.region_id)
    before_sd = analyze_supply_demand(db, crop.id, farm.region_id, farm.id, before_prod["expected_production_kg"], payload.get("market_id"))
    before_risk = surplus_risk(db, crop.id, farm.region_id, farm.id)
    before_alloc = allocate_markets(db, farm.id, crop.id, before_prod["expected_production_kg"])

    area = payload.get("land_area_ha") or farm.land_area_ha
    after_prod = production_estimate(db, crop.id, farm.id, area, farm.region_id)
    if payload.get("cultivation_quantity_kg") is not None:
        after_prod = {**after_prod, "expected_production_kg": float(payload["cultivation_quantity_kg"])}
    demand_override = payload.get("demand_override_kg")
    if demand_override is not None:
        gap = demand_override - after_prod["expected_production_kg"]
        status = "Shortage" if gap > demand_override * 0.1 else "Surplus" if gap < -demand_override * 0.1 else "Balanced"
        after_sd = {
            "expected_supply_kg": after_prod["expected_production_kg"],
            "predicted_demand_kg": demand_override,
            "gap_kg": gap,
            "status": status,
            "risk_level": "Medium Risk" if status != "Balanced" else "Low Risk",
        }
    else:
        after_sd = analyze_supply_demand(
            db, crop.id, farm.region_id, farm.id, after_prod["expected_production_kg"], payload.get("market_id")
        )
    after_risk = surplus_risk(db, crop.id, farm.region_id, farm.id)
    after_alloc = allocate_markets(db, farm.id, crop.id, after_prod["expected_production_kg"])
    interpretation = (
        f"BEFORE status {before_sd['status']} → AFTER status {after_sd['status']}. "
        f"Supply moved from {before_prod['expected_production_kg']:.0f} kg to {after_prod['expected_production_kg']:.0f} kg."
    )
    result = {
        "before": {"production": before_prod, "supply_demand": before_sd, "risk": before_risk, "top_market": before_alloc[0] if before_alloc else None},
        "after": {"production": after_prod, "supply_demand": after_sd, "risk": after_risk, "top_market": after_alloc[0] if after_alloc else None},
        "interpretation": interpretation,
    }
    db.add(
        WhatIfScenario(
            user_id=user_id,
            name=payload.get("name", "Scenario"),
            assumptions=payload,
            results=result,
        )
    )
    db.commit()
    return result


def dashboard_summary(db: Session, region_id: int | None, crop_id: int | None, farm_id: int | None) -> dict:
    crops = db.query(Crop).count()
    farm = db.query(Farm).get(farm_id) if farm_id else db.query(Farm).first()
    crop = db.query(Crop).get(crop_id) if crop_id else db.query(Crop).filter(Crop.name == "Strawberry").first()
    if not crop:
        crop = db.query(Crop).first()
    region_id = region_id or (farm.region_id if farm else 1)
    prod = production_estimate(db, crop.id, farm.id if farm else None, farm.land_area_ha if farm else 1.0, region_id)

    # Prefer recent historical demand for dashboard cards; ML forecast is still available on Demand page.
    dates, values = _agg_demand_series(db, crop.id, region_id, None)
    predicted_demand = float(sum(values[-3:]) / 3) if len(values) >= 3 else (values[-1] if values else 0)
    gap = predicted_demand - prod["expected_production_kg"]
    if gap > predicted_demand * 0.1:
        status, risk_level = "Shortage", "Medium Risk"
    elif gap < -predicted_demand * 0.1:
        status, risk_level = "Surplus", "High Risk" if crop.perishability.lower() == "high" else "Medium Risk"
    else:
        status, risk_level = "Balanced", "Low Risk"

    p_dates, p_values = _agg_price_series(db, crop.id, None, region_id)
    avg_price = float(sum(p_values[-6:]) / min(6, len(p_values))) if p_values else 0.0

    recs = recommend_crops(db, farm.id) if farm else []
    # Lightweight market pick without forecasting every market
    recommended_market = None
    if farm:
        local = db.query(Market).filter(Market.region_id == farm.region_id).first()
        recommended_market = local.name if local else None

    demand_trend = [{"date": str(d), "value": v, "kind": "historical"} for d, v in list(zip(dates, values))[-18:]]
    price_trend = [{"date": str(d), "value": v, "kind": "historical"} for d, v in list(zip(p_dates, p_values))[-18:]]
    try:
        d_fc = forecast_demand(db, crop.id, region_id, None, 6)
        p_fc = forecast_price(db, crop.id, region_id, None, 6)
        demand_trend = demand_trend[-12:] + [
            {"date": str(p["period_date"]), "value": p["value"], "kind": "forecast"} for p in d_fc["forecast"]
        ]
        price_trend = price_trend[-12:] + [
            {"date": str(p["period_date"]), "value": p["value"], "kind": "forecast"} for p in p_fc["forecast"]
        ]
        predicted_demand = sum(p["value"] for p in d_fc["forecast"]) / max(len(d_fc["forecast"]), 1)
        gap = predicted_demand - prod["expected_production_kg"]
    except ValueError:
        pass

    return {
        "total_crops": crops,
        "predicted_demand_kg": round(predicted_demand, 2),
        "expected_production_kg": prod["expected_production_kg"],
        "supply_demand_gap_kg": round(gap, 2),
        "average_price": round(avg_price, 2),
        "surplus_risk": risk_level,
        "recommended_crop": recs[0]["crop_name"] if recs else crop.name,
        "recommended_market": recommended_market,
        "demand_trend": demand_trend,
        "price_trend": price_trend,
        "supply_vs_demand": [
            {"label": "Supply", "value": prod["expected_production_kg"]},
            {"label": "Demand", "value": round(predicted_demand, 2)},
        ],
        "crop_recommendations": [{"name": r["crop_name"], "score": r["combined_score"]} for r in recs[:6]],
        "risk_distribution": [
            {"name": "Low", "value": 1 if "Low" in risk_level or "LOW" in risk_level else 0},
            {"name": "Medium", "value": 1 if "Medium" in risk_level or "MEDIUM" in risk_level else 0},
            {"name": "High", "value": 1 if "High" in risk_level or "HIGH" in risk_level else 0},
        ],
        "disclaimer": f"Baseline ML intelligence models & operational status analytics. Status: {status}.",
    }
