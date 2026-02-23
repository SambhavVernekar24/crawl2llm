import asyncio
from typing import Dict, Any
from datetime import datetime
import logging
from app.crawler.spider import WebSpider
from app.crawler.processor import ContentProcessor
from app.processing.deduplicator import Deduplicator
from app.storage.database import SessionLocal, PageDB, JobDB
from app.storage.exporters import DataExporter
import uuid
import json

logger = logging.getLogger(__name__)

class CrawlerScheduler:
    def __init__(self, job_id: str, config: Dict[str, Any]):
        self.job_id = job_id
        self.config = config
        self.spider = WebSpider(job_id, config)
        self.processor = ContentProcessor(config)
        self.deduplicator = Deduplicator()
        self.exporter = DataExporter(job_id, config)
        self.is_running = False
        self.pages_processed = 0
    
    async def start_crawling(self):
        """Start the crawling process"""
        self.is_running = True
        
        try:
            async for crawled_data in self.spider.crawl(
                self.config['seed_urls'],
                self.config['max_depth'],
                self.config['max_pages']
            ):
                if not self.is_running:
                    break
                
                # Process the crawled data
                processed = self.processor.process(crawled_data)
                
                if processed:
                    # Check for duplicates
                    if self.config.get("enable_deduplication", True):
                        if self.deduplicator.is_duplicate_exact(processed['text']):
                            logger.info(f"Skipping duplicate: {processed['url']}")
                            continue
                        
                        if processed['embedding']:
                            if self.deduplicator.is_duplicate_semantic(
                                processed['embedding'],
                                processed['text']
                            ):
                                logger.info(f"Skipping semantic duplicate: {processed['url']}")
                                continue
                    
                    # Save to database
                    await self.save_to_database(processed)
                    
                    # Export in real-time
                    await self.exporter.export_chunk(processed)
                    
                    self.pages_processed += 1
                    
                    # Update job progress
                    await self.update_job_progress()
        
        except Exception as e:
            logger.error(f"Crawling error: {e}")
            raise
        
        finally:
            # Final export
            self.exporter.finalize()
            self.is_running = False
    
    async def save_to_database(self, processed: Dict[str, Any]):
        """Save processed data to database"""
        db = SessionLocal()
        try:
            page = PageDB(
                page_id=str(uuid.uuid4()),
                job_id=self.job_id,
                url=processed['url'],
                title=processed['title'],
                clean_text=processed['text'],
                chunks=processed['chunks'],
                topic=processed['topic'],
                trust_score=processed['trust_score'],
                embedding=processed.get('embedding'),
                metadata=processed['metadata'],
                processed_at=datetime.utcnow()
            )
            db.add(page)
            db.commit()
        finally:
            db.close()
    
    async def update_job_progress(self):
        """Update job progress in database"""
        db = SessionLocal()
        try:
            job = db.query(JobDB).filter(JobDB.job_id == self.job_id).first()
            if job:
                job.pages_crawled = self.pages_processed
                job.updated_at = datetime.utcnow()
                db.commit()
        finally:
            db.close()
    
    async def stop(self):
        """Stop the crawling process"""
        self.is_running = False
        logger.info(f"Stopping crawler for job {self.job_id}")