from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Prefer PostgreSQL in Docker/production. SQLite is a local academic fallback when Postgres is unavailable.
    DATABASE_URL: str = "sqlite:///./agriculture_demo.db"
    SECRET_KEY: str = "change-this-academic-demo-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    YOLO_WEIGHTS_PATH: str = "../vision/weights/best.pt"
    YOLO_CONFIDENCE: float = 0.25
    PLANT_HEALTH_MODEL_PATH: str | None = None
    PLANT_HEALTH_MODEL_TYPE: str = "yolo"
    PLANT_HEALTH_MOCK_MODE: bool = True


    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
