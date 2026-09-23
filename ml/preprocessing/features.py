from datetime import date

import numpy as np
import pandas as pd


def month_features(dates: pd.Series) -> pd.DataFrame:
    dt = pd.to_datetime(dates)
    out = pd.DataFrame(index=dt.index)
    out["year"] = dt.dt.year
    out["month"] = dt.dt.month
    out["month_sin"] = np.sin(2 * np.pi * dt.dt.month / 12)
    out["month_cos"] = np.cos(2 * np.pi * dt.dt.month / 12)
    out["t"] = np.arange(len(dt))
    return out


def add_lags(series: pd.Series, lags=(1, 2, 3, 12)) -> pd.DataFrame:
    frame = pd.DataFrame({"y": series.astype(float)})
    for lag in lags:
        frame[f"lag_{lag}"] = frame["y"].shift(lag)
    return frame


def season_from_month(month: int) -> str:
    if month in (6, 7, 8, 9):
        return "kharif"
    if month in (10, 11, 12, 1):
        return "rabi"
    return "zaid"


def next_month_dates(last: date, horizon: int) -> list[date]:
    y, m = last.year, last.month
    out = []
    for _ in range(horizon):
        m += 1
        if m > 12:
            m = 1
            y += 1
        out.append(date(y, m, 1))
    return out
