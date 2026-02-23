from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class CrawlJobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

class OutputFormat(str, Enum):
    JSONL = "jsonl"
    PARQUET = "parquet"
    CSV = "csv"
    LANGCHAIN = "langchain"

class CrawlRequest(BaseModel):
    seed_urls: List[HttpUrl] = Field(..., description="List of URLs to start crawling from")
    max_depth: int = Field(3, ge=1, le=10, description="Maximum crawl depth")
    max_pages: int = Field(100, ge=1, le=10000, description="Maximum pages to crawl")
    respect_robots: bool = Field(True, description="Respect robots.txt")
    output_format: OutputFormat = Field(OutputFormat.JSONL, description="Output format")
    enable_deduplication: bool = Field(True, description="Enable deduplication using embeddings")
    chunk_size: int = Field(512, description="Chunk size for text splitting")
    chunk_overlap: int = Field(50, description="Overlap between chunks")
    enable_legal_check: bool = Field(True, description="Check legal compliance")
    privacy_filter: bool = Field(True, description="Filter sensitive data")
    topic_classification: bool = Field(True, description="Classify content by topic")
    trust_score: bool = Field(True, description="Calculate trust score")
    callback_url: Optional[str] = Field(None, description="Webhook callback URL")
    
    class Config:
        schema_extra = {
            "example": {
                "seed_urls": ["https://example.com/docs"],
                "max_depth": 2,
                "max_pages": 50,
                "output_format": "jsonl",
                "chunk_size": 512
            }
        }

class CrawlJobResponse(BaseModel):
    job_id: str
    status: CrawlJobStatus
    seed_urls: List[str]
    created_at: datetime
    updated_at: datetime
    pages_crawled: int
    total_pages: int
    error: Optional[str] = None

class CrawlStats(BaseModel):
    job_id: str
    pages_crawled: int
    pages_processed: int
    chunks_created: int
    unique_content_percentage: float
    avg_trust_score: float
    topics_distribution: Dict[str, int]
    start_time: datetime
    estimated_completion: Optional[datetime]

class ExtractedData(BaseModel):
    id: str
    text: str
    source_url: str
    title: str
    topic: str
    trust_score: float
    created_at: datetime
    word_count: int
    chunk_index: int
    total_chunks: int
    embedding_ready: bool = True
    metadata: Dict[str, Any]