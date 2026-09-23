"""Train forecast artifacts from CSV DEMO series (optional offline job)."""

from pathlib import Path
import sys

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from ml.forecasting.baseline import train_and_forecast  # noqa: E402


def main():
    csv = ROOT / "ml" / "data" / "demo_demand_prices.csv"
    if not csv.exists():
        print("No CSV found. Use backend seed + /admin/train instead.")
        return
    df = pd.read_csv(csv)
    for crop, g in df.groupby("crop"):
        g = g.sort_values("period_date")
        res = train_and_forecast(g["period_date"], g["demand_kg"], horizon=6, model_key=f"demand_{crop}")
        print(crop, res["metrics"])


if __name__ == "__main__":
    main()
