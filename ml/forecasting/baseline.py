"""Baseline demand/price forecasting.

CURRENTLY IMPLEMENTED: Ridge regression on calendar + lag features, trained on
labelled DEMO historical series stored in PostgreSQL.

This is an academic baseline, not a production-grade market model.
"""

from __future__ import annotations

import joblib
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from ml.evaluation.metrics import ARTIFACTS, regression_metrics
from ml.preprocessing.features import month_features, next_month_dates


FEATURE_COLS = ["year", "month", "month_sin", "month_cos", "t", "lag_1", "lag_2", "lag_3"]


def _pipeline() -> Pipeline:
    return Pipeline([("scaler", StandardScaler()), ("model", Ridge(alpha=1.0))])


def prepare_frame(dates, values) -> pd.DataFrame:
    df = pd.DataFrame({"period_date": pd.to_datetime(dates), "y": values}).sort_values("period_date")
    feats = month_features(df["period_date"])
    df = pd.concat([df.reset_index(drop=True), feats.reset_index(drop=True)], axis=1)
    df["lag_1"] = df["y"].shift(1)
    df["lag_2"] = df["y"].shift(2)
    df["lag_3"] = df["y"].shift(3)
    return df.dropna().reset_index(drop=True)


def train_and_forecast(dates, values, horizon: int = 6, model_key: str = "demand") -> dict:
    df = prepare_frame(dates, values)
    if len(df) < 8:
        raise ValueError("Insufficient historical series for baseline forecast (need ~8+ months after lags).")

    split = max(4, int(len(df) * 0.8))
    train, test = df.iloc[:split], df.iloc[split:]
    pipe = _pipeline()
    pipe.fit(train[FEATURE_COLS], train["y"])

    metrics = {"mae": None, "rmse": None, "r2": None, "n": 0}
    if len(test) >= 2:
        pred_test = pipe.predict(test[FEATURE_COLS])
        metrics = regression_metrics(test["y"], pred_test)

    path = ARTIFACTS / f"{model_key}_ridge.joblib"
    joblib.dump({"pipeline": pipe, "last_values": df["y"].tolist()[-3:], "last_date": df["period_date"].max()}, path)

    history_y = df["y"].tolist()
    last_date = df["period_date"].max().date()
    future_dates = next_month_dates(last_date, horizon)
    lags = history_y[-3:]
    t0 = int(df["t"].max())
    forecasts = []
    for i, d in enumerate(future_dates, start=1):
        row = {
            "year": d.year,
            "month": d.month,
            "month_sin": np.sin(2 * np.pi * d.month / 12),
            "month_cos": np.cos(2 * np.pi * d.month / 12),
            "t": t0 + i,
            "lag_1": lags[-1],
            "lag_2": lags[-2],
            "lag_3": lags[-3],
        }
        yhat = float(pipe.predict(pd.DataFrame([row])[FEATURE_COLS])[0])
        yhat = max(0.0, yhat)
        forecasts.append({"period_date": d, "value": round(yhat, 2)})
        lags = lags[1:] + [yhat]

    historical = [
        {"period_date": r.period_date.date() if hasattr(r.period_date, "date") else r.period_date, "value": float(r.y)}
        for r in df.itertuples()
    ]
    return {
        "model_name": "Ridge+lags (baseline)",
        "metrics": metrics,
        "historical": historical,
        "forecast": forecasts,
        "artifact": str(path),
    }
