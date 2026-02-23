"""
API module for AI-Ready Web Crawler
Contains route handlers, request/response models, and API endpoints
"""

from app.api.routes import router
from app.api.models import (
    CrawlRequest,
    CrawlJobResponse,
    CrawlStats,
    ExtractedData,
    CrawlJobStatus,
    OutputFormat
)

__all__ = [
    'router',
    'CrawlRequest',
    'CrawlJobResponse',
    'CrawlStats',
    'ExtractedData',
    'CrawlJobStatus',
    'OutputFormat'
]