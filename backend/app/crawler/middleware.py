"""
Middleware for crawler - handles rate limiting, retries, and error handling
"""
import asyncio
import logging
from typing import Optional, Callable, Any
from datetime import datetime, timedelta
import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, requests_per_second: float = 1.0):
        self.requests_per_second = requests_per_second
        self.last_request_time = {}
        self.lock = asyncio.Lock()
    
    async def acquire(self, domain: str):
        async with self.lock:
            now = datetime.now()
            if domain in self.last_request_time:
                time_since_last = (now - self.last_request_time[domain]).total_seconds()
                if time_since_last < (1.0 / self.requests_per_second):
                    wait_time = (1.0 / self.requests_per_second) - time_since_last
                    await asyncio.sleep(wait_time)
            
            self.last_request_time[domain] = now

class RetryMiddleware:
    def __init__(self, max_retries: int = 3, retry_codes: list = None):
        self.max_retries = max_retries
        self.retry_codes = retry_codes or [500, 502, 503, 504, 429]
    
    async def execute_with_retry(self, func: Callable, *args, **kwargs) -> Optional[Any]:
        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            except aiohttp.ClientError as e:
                if hasattr(e, 'status') and e.status in self.retry_codes:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Request failed (attempt {attempt + 1}), retrying in {wait_time}s")
                    await asyncio.sleep(wait_time)
                else:
                    raise
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise
                wait_time = 2 ** attempt
                logger.warning(f"Error: {e}, retrying in {wait_time}s")
                await asyncio.sleep(wait_time)
        
        return None