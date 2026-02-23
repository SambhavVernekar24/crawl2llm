"""
Crawler module for AI-Ready Web Crawler
Handles web crawling, content extraction, and processing
"""

from app.crawler.spider import WebSpider
from app.crawler.processor import ContentProcessor
from app.crawler.scheduler import CrawlerScheduler
from app.crawler.extractor import ContentExtractor
from app.crawler.tasks import celery_app, run_crawl_task

__all__ = [
    'WebSpider',
    'ContentProcessor',
    'CrawlerScheduler',
    'ContentExtractor',
    'celery_app',
    'run_crawl_task'
]