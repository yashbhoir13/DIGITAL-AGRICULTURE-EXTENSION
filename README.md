# Digital Agriculture Extension Prototype

Academic **BE Computer Science & Engineering (Data Science)** major-project prototype that connects crop cultivation planning with regional and seasonal market requirements.

> **Important:** This system uses labelled **DEMO / SAMPLE** data and **baseline ML models**. It does **not** claim real-time government mandi feeds, guaranteed yields, or production-ready forecast accuracy.

---

## Problem statement

Farmers often decide what to cultivate with incomplete visibility into future regional demand, price trends, harvest timing, and market absorption capacity. Misalignment leads to shortage, surplus, and wastage risk.

## Objectives

Help users answer:

1. What crop should be cultivated?
2. How much should be cultivated?
3. When should cultivation start?
4. When is the expected harvesting period?
5. What will future market demand be?
6. Is there likely shortage or surplus?
7. What is the expected price trend?
8. Which market should receive the produce?
9. Is there risk of unsold produce / wastage?

## Features (CURRENTLY IMPLEMENTED)

| Module | Status |
|--------|--------|
| Auth (JWT) + farmer/admin roles | Implemented |
| Farm / soil / region profiles | Implemented |
| Crop & market CRUD (admin) | Implemented |
| Demand & price forecasting (Ridge + lags on DEMO series) | Implemented |
| Production estimation | Implemented |
| Crop recommendation (agri + market scores) | Implemented |
| Supply–demand balancing | Implemented |
| Demand-to-harvest scheduling | Implemented |
| Surplus/wastage risk | Implemented |
| Market allocation + alternatives | Implemented |
| Logistics-aware ranking (DEMO distances/costs) | Implemented |
| What-If simulation | Implemented |
| Strawberry CV module (YOLO if weights present; DEMO HSV fallback) | Implemented |
| Dashboard with filters & charts | Implemented |
| Docker Compose (frontend, backend, PostgreSQL) | Implemented |

### Proposed / FUTURE SCOPE

- Live AGMARKNET / eNAM market feeds
- Weather APIs & IoT farm sensors
- FPO/cooperative workflows
- Third-party logistics / cold-storage APIs
- Digital marketplace checkout
- Full Ultralytics training on a private annotated strawberry dataset with reported mAP from real eval only

---

## Architecture

```
DATA SOURCES (DEMO seed)
        ↓
DATA INGESTION / PREPROCESSING
        ↓
PostgreSQL
        ↓
Analytics + AI/ML (forecast, production, recommendation)
        ↓
Intelligence Engine
        ↓
FastAPI
        ↓
React dashboard (farmer / admin)
```

Strawberry detection is a **module**, not the whole project:

```
Image upload → YOLO weights (if present) or DEMO heuristic → boxes + confidence → monitoring support
```

---

## Technology stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts, Axios
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy
- **Database:** PostgreSQL
- **ML:** Pandas, NumPy, Scikit-learn (Ridge baseline forecasting)
- **Vision:** Ultralytics YOLO (optional weights) + OpenCV DEMO fallback

---

## Folder structure

```
agriculture/
├── frontend/          # React app
├── backend/           # FastAPI app
├── ml/                # preprocessing, forecasting, recommendation, production, training, artifacts
├── vision/            # dataset placeholder, training script, inference, weights/
├── database/          # Alembic migration scaffolding
├── docker/            # Dockerfiles + nginx
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## Environment variables

Copy `.env.example` to `.env` (a starter `.env` is included for local DEMO).

Key variables:

- `DATABASE_URL`
- `SECRET_KEY`
- `BACKEND_CORS_ORIGINS`
- `YOLO_WEIGHTS_PATH`
- `VITE_API_BASE_URL`

---

## How to run with Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend / Swagger: http://localhost:8000/docs  
- PostgreSQL: localhost:5432  

On first backend start, tables are created and **DEMO DATA** is seeded automatically.

---

## How to run locally

### 1) PostgreSQL

Create DB/user matching `.env`, or start only the database:

```bash
docker compose up -d db
```

### 2) Backend

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend
set PYTHONPATH=..;.;..
uvicorn app.main:app --reload --port 8000
```

PowerShell:

```powershell
$env:PYTHONPATH = "c:\WEBSITE\YASH\agriculture;c:\WEBSITE\YASH\agriculture\backend"
cd c:\WEBSITE\YASH\agriculture\backend
uvicorn app.main:app --reload --port 8000
```

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4) Optional ML offline training

```bash
python ml/training/train_forecasts.py
```

Admin UI / `POST /admin/train-forecasts` refreshes baseline artifacts from DB series and returns **real holdout metrics only** (MAE, RMSE, R²).

### 5) YOLO setup

1. Prepare a YOLO-format dataset under `vision/dataset/`
2. Train: `python vision/training/train_yolo.py` (or Ultralytics CLI)
3. Copy `best.pt` to `vision/weights/best.pt`
4. Restart backend — `/vision/strawberry/detect` will use YOLO

Until weights exist, detection uses a **labelled DEMO HSV heuristic** (not YOLO accuracy).

Existing Colab notebooks in the repo root (`Strawberry_Disease_*.ipynb`) can inform training experiments; they are not the full product.

---

## Sample credentials

| Role   | Email              | Password   |
|--------|--------------------|------------|
| Farmer | farmer@agri.demo   | farmer123  |
| Admin  | admin@agri.demo    | admin123   |

---

## API documentation

Open **http://localhost:8000/docs** for interactive Swagger.

Representative endpoints:

- `POST /auth/login`, `POST /auth/register`
- `GET/POST /crops`, `GET/POST /markets`, `GET/POST /farms`
- `GET /demand/forecast`, `GET /prices/forecast`
- `POST /production/estimate`
- `POST /recommendations/crops`
- `POST /supply-demand/analyze`
- `POST /schedule/cultivation`
- `GET /risk/surplus`
- `POST /market/allocation`
- `POST /simulation/what-if`
- `POST /vision/strawberry/detect`
- `GET /dashboard`
- `GET /admin/stats`

---

## ML evaluation policy

- Forecasting metrics (MAE, RMSE, R²) are computed on a holdout split of **DEMO** series when enough points exist.
- Object-detection Precision / Recall / mAP / IoU are **not displayed unless computed from a real evaluation run**.
- Never invent accuracy numbers for the report/demo.

---

## Database

Normalized PostgreSQL schema covers users, regions, farms, soil, crops, markets, demand/prices, logistics, forecasts, recommendations, cultivation plans, harvest schedules, supply–demand, risk, allocations, model predictions, and what-if scenarios.

- Auto `create_all` + seed on startup (prototype convenience)
- Alembic scaffolding under `database/migrations/` for team migration workflows

---

## Security (prototype)

- Bcrypt password hashing
- JWT bearer auth
- Role-based admin routes
- Pydantic validation
- CORS configuration
- No plaintext passwords

---

## Disclaimer

CURRENTLY IMPLEMENTED functionality is an **academic decision-support prototype**.  
Do not represent DEMO forecasts as real-world market advice.
