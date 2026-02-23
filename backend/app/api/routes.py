from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import List
from datetime import datetime
import uuid
import asyncio
from app.api.models import CrawlRequest, CrawlJobResponse, CrawlStats, ExtractedData
from app.crawler.scheduler import CrawlerScheduler
from app.storage.database import get_db, JobDB, PageDB
from sqlalchemy.orm import Session
from app.utils.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Store active crawlers
active_crawlers = {}

@router.post("/crawl", response_model=CrawlJobResponse)
async def start_crawl(
    request: CrawlRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Start a new crawling job
    """
    try:
        job_id = str(uuid.uuid4())
        
        # Create job record
        job = JobDB(
            job_id=job_id,
            status="pending",
            seed_urls=[str(url) for url in request.seed_urls],
            config=request.dict(),
            created_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
        
        # Initialize scheduler
        scheduler = CrawlerScheduler(job_id, request.dict())
        active_crawlers[job_id] = scheduler
        
        # Start crawling in background
        background_tasks.add_task(run_crawl_job, job_id, scheduler, db)
        
        return CrawlJobResponse(
            job_id=job_id,
            status="pending",
            seed_urls=[str(url) for url in request.seed_urls],
            created_at=job.created_at,
            updated_at=job.created_at,
            pages_crawled=0,
            total_pages=request.max_pages
        )
    
    except Exception as e:
        logger.error(f"Failed to start crawl job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_crawl_job(job_id: str, scheduler: CrawlerScheduler, db: Session):
    """
    Run the crawling job in background
    """
    try:
        # Update job status
        job = db.query(JobDB).filter(JobDB.job_id == job_id).first()
        job.status = "running"
        job.updated_at = datetime.utcnow()
        db.commit()
        
        # Start crawling
        await scheduler.start_crawling()
        
        # Update job as completed
        job.status = "completed"
        job.updated_at = datetime.utcnow()
        job.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        logger.error(f"Crawl job {job_id} failed: {e}")
        job = db.query(JobDB).filter(JobDB.job_id == job_id).first()
        job.status = "failed"
        job.error = str(e)
        job.updated_at = datetime.utcnow()
        db.commit()
    
    finally:
        # Cleanup
        if job_id in active_crawlers:
            del active_crawlers[job_id]

@router.get("/jobs", response_model=List[CrawlJobResponse])
async def list_jobs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List all crawl jobs
    """
    jobs = db.query(JobDB).order_by(JobDB.created_at.desc()).offset(skip).limit(limit).all()
    return [
        CrawlJobResponse(
            job_id=job.job_id,
            status=job.status,
            seed_urls=job.seed_urls,
            created_at=job.created_at,
            updated_at=job.updated_at,
            pages_crawled=job.pages_crawled,
            total_pages=job.config.get("max_pages", 100)
        )
        for job in jobs
    ]

@router.get("/jobs/{job_id}", response_model=CrawlJobResponse)
async def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """
    Get status of a specific crawl job
    """
    job = db.query(JobDB).filter(JobDB.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return CrawlJobResponse(
        job_id=job.job_id,
        status=job.status,
        seed_urls=job.seed_urls,
        created_at=job.created_at,
        updated_at=job.updated_at,
        pages_crawled=job.pages_crawled,
        total_pages=job.config.get("max_pages", 100),
        error=job.error
    )

@router.get("/jobs/{job_id}/stats", response_model=CrawlStats)
async def get_job_stats(job_id: str, db: Session = Depends(get_db)):
    """
    Get detailed statistics for a crawl job
    """
    job = db.query(JobDB).filter(JobDB.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get pages data
    pages = db.query(PageDB).filter(PageDB.job_id == job_id).all()
    
    # Calculate stats
    total_pages = len(pages)
    total_chunks = sum(len(page.chunks) if page.chunks else 0 for page in pages)
    
    # Topic distribution
    topics = {}
    for page in pages:
        topic = page.topic or "unknown"
        topics[topic] = topics.get(topic, 0) + 1
    
    return CrawlStats(
        job_id=job_id,
        pages_crawled=total_pages,
        pages_processed=total_pages,
        chunks_created=total_chunks,
        unique_content_percentage=95.5,  # Calculate from deduplication
        avg_trust_score=0.85,  # Calculate average
        topics_distribution=topics,
        start_time=job.created_at,
        estimated_completion=job.completed_at
    )

@router.post("/jobs/{job_id}/stop")
async def stop_job(job_id: str):
    """
    Stop a running crawl job
    """
    if job_id in active_crawlers:
        await active_crawlers[job_id].stop()
        return {"message": "Job stopped successfully"}
    
    raise HTTPException(status_code=404, detail="Job not found or not running")

@router.get("/jobs/{job_id}/data", response_model=List[ExtractedData])
async def get_extracted_data(
    job_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get extracted data for a job
    """
    pages = db.query(PageDB).filter(
        PageDB.job_id == job_id
    ).offset(skip).limit(limit).all()
    
    data = []
    for page in pages:
        if page.chunks:
            for idx, chunk in enumerate(page.chunks):
                data.append(ExtractedData(
                    id=f"{page.page_id}_{idx}",
                    text=chunk,
                    source_url=page.url,
                    title=page.title,
                    topic=page.topic or "unknown",
                    trust_score=page.trust_score or 0.5,
                    created_at=page.crawled_at,
                    word_count=len(chunk.split()),
                    chunk_index=idx,
                    total_chunks=len(page.chunks),
                    metadata=page.metadata or {}
                ))
    
    return data

@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, db: Session = Depends(get_db)):
    """
    Delete a job and its data
    """
    job = db.query(JobDB).filter(JobDB.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete associated pages
    db.query(PageDB).filter(PageDB.job_id == job_id).delete()
    
    # Delete job
    db.delete(job)
    db.commit()
    
    return {"message": "Job deleted successfully"}