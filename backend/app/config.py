from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr, field_validator
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://username:password@localhost:5432/maze_puzzle_db"
    
    # JWT
    SECRET_KEY: SecretStr
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://your-app.vercel.app"
    
    # App
    ENVIRONMENT: str = "development"
    APP_NAME: str = "Maze Puzzle API"
    VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @property
    def DEBUG(self) -> bool:
        return self.ENVIRONMENT != "production"

    def get_allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def validate_secret_key(cls, v):
        if isinstance(v, str) and v == "your-super-secret-key-change-in-production":
            raise ValueError("SECRET_KEY must be changed from default value")
        return v


settings = Settings()