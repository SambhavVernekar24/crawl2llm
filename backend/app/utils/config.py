from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI-Ready Web Crawler"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@postgres:5432/crawler_db"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379"
    
    # Crawler settings
    DEFAULT_USER_AGENT: str = "AI-Ready-Crawler/1.0"
    CRAWL_TIMEOUT: int = 30
    MAX_CONCURRENT_REQUESTS: int = 10
    REQUEST_DELAY: float = 1.0
    
    # Storage
    OUTPUT_DIR: str = "/app/output"
    MAX_STORAGE_GB: int = 10
    VECTOR_STORE_PATH: str = "/app/data/vector_store"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AI-Ready Web Crawler API"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()