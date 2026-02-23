from sqlalchemy import create_engine, Column, String, Integer, DateTime, JSON, Float, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/crawler_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class JobDB(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True)
    status = Column(String)
    seed_urls = Column(JSON)
    config = Column(JSON)
    pages_crawled = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)

class PageDB(Base):
    __tablename__ = "pages"
    
    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(String, unique=True, index=True)
    job_id = Column(String, index=True)
    url = Column(String, index=True)
    title = Column(String)
    raw_html = Column(Text, nullable=True)
    clean_text = Column(Text)
    chunks = Column(JSON)
    topic = Column(String, nullable=True)
    trust_score = Column(Float, nullable=True)
    embedding = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)
    crawled_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

class CacheDB(Base):
    __tablename__ = "cache"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    content_hash = Column(String)
    cached_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)