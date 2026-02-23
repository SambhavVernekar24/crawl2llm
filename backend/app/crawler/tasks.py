from celery import Celery
from app.crawler.scheduler import CrawlerScheduler
import asyncio
import logging

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    'crawler',
    broker='redis://redis:6379/0',
    backend='redis://redis:6379/0'
)

@celery_app.task(bind=True, max_retries=3)
def run_crawl_task(self, job_id: str, config: dict):
    """Run crawl job as Celery task"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        scheduler = CrawlerScheduler(job_id, config)
        loop.run_until_complete(scheduler.start_crawling())
        
        return {'status': 'completed', 'job_id': job_id}
    
    except Exception as e:
        logger.error(f"Celery task failed: {e}")
        self.retry(exc=e, countdown=60)
        return {'status': 'failed', 'job_id': job_id, 'error': str(e)}