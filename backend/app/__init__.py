"""
AI-Ready Web Crawler
Convert websites into clean, structured LLM-ready datasets

This package provides a complete web crawling and content processing pipeline
that transforms raw HTML into AI-ready training data.
"""

__version__ = "1.0.0"
__author__ = "AI-Ready Crawler Team"
__license__ = "MIT"
__description__ = "Intelligent web crawler that converts websites into AI-trainable datasets"

import logging
from typing import Dict, Any, Optional

# Configure package-level logger
logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

# Import main components for easier access
from app.api import routes
from app.api.models import (
    CrawlRequest,
    CrawlJobResponse,
    CrawlStats,
    ExtractedData,
    CrawlJobStatus,
    OutputFormat
)

from app.crawler import (
    WebSpider,
    ContentProcessor,
    CrawlerScheduler,
    ContentExtractor
)

from app.processing import (
    Deduplicator,
    TextCleaner,
    TextChunker,
    ContentTagger
)

from app.storage import (
    JobDB,
    PageDB,
    CacheDB,
    DataExporter,
    VectorStore,
    get_db
)

from app.utils import (
    settings,
    check_robots_txt,
    is_allowed,
    detect_license,
    filter_privacy
)

# Package metadata
__all__ = [
    # Version info
    '__version__',
    '__author__',
    '__license__',
    '__description__',
    
    # API
    'routes',
    'CrawlRequest',
    'CrawlJobResponse',
    'CrawlStats',
    'ExtractedData',
    'CrawlJobStatus',
    'OutputFormat',
    
    # Crawler
    'WebSpider',
    'ContentProcessor',
    'CrawlerScheduler',
    'ContentExtractor',
    
    # Processing
    'Deduplicator',
    'TextCleaner',
    'TextChunker',
    'ContentTagger',
    
    # Storage
    'JobDB',
    'PageDB',
    'CacheDB',
    'DataExporter',
    'VectorStore',
    'get_db',
    
    # Utils
    'settings',
    'check_robots_txt',
    'is_allowed',
    'detect_license',
    'filter_privacy',
]

def get_version() -> str:
    """Return the package version"""
    return __version__

def get_package_info() -> Dict[str, Any]:
    """Return package information as a dictionary"""
    return {
        'name': 'ai-ready-crawler',
        'version': __version__,
        'author': __author__,
        'license': __license__,
        'description': __description__,
        'python_requires': '>=3.8'
    }

def initialize_app(config: Optional[Dict[str, Any]] = None) -> None:
    """
    Initialize the application with optional configuration
    
    Args:
        config: Optional configuration dictionary to override defaults
    """
    global settings
    
    if config:
        # Update settings with provided config
        for key, value in config.items():
            if hasattr(settings, key.upper()):
                setattr(settings, key.upper(), value)
                logger.info(f"Updated setting: {key}={value}")
    
    logger.info(f"AI-Ready Web Crawler v{__version__} initialized")
    logger.info(f"Configuration: {settings.dict()}")

def shutdown_app() -> None:
    """Clean shutdown of the application"""
    logger.info("Shutting down AI-Ready Web Crawler")
    # Add any cleanup code here if needed

# Initialize on import (can be disabled by setting environment variable)
import os
if os.environ.get('AUTO_INITIALIZE', 'true').lower() == 'true':
    initialize_app()