import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
for p in (ROOT, ROOT / "backend"):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, auth, catalog, cctv, intelligence, mandi, marketplace, plant_health, weather
from app.core.config import settings
from app.database.seed import seed_if_empty
from app.database.session import Base, SessionLocal, engine
import app.models  # noqa: F401


def create_app() -> FastAPI:
    app = FastAPI(
        title="AgriSmart - Farm Intelligence & Security Engine",
        description=(
            "Operational Agricultural Planning, Real-time Agro-Weather Microclimate, "
            "Live APMC Mandi Price Intelligence, Farmer Marketplace, and AI CCTV Plant Protection."
        ),
        version="2.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins + ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup():
        try:
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                seed_if_empty(db)
            finally:
                db.close()
        except Exception as exc:  # noqa: BLE001
            app.state.db_error = str(exc)

    @app.get("/")
    def root():
        return {
            "name": "AgriSmart API",
            "version": "2.0.0",
            "status": "online",
            "docs": "/docs",
            "frontend": "http://localhost:5173",
        }

    @app.get("/health")
    def health():
        err = getattr(app.state, "db_error", None)
        return {"status": "ok" if not err else "degraded", "database_error": err}

    app.include_router(auth.router)
    app.include_router(catalog.router)
    app.include_router(intelligence.router)
    app.include_router(admin.router)
    app.include_router(cctv.router)
    app.include_router(weather.router)
    app.include_router(mandi.router)
    app.include_router(marketplace.router)
    app.include_router(plant_health.router)
    return app



app = create_app()
