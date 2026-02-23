import asyncio
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import hashlib
import logging
from typing import Set, List, Optional
from playwright.async_api import async_playwright
import trafilatura
from app.utils.legal import check_robots_txt, is_allowed
import tldextract

logger = logging.getLogger(__name__)

class WebSpider:
    def __init__(self, job_id: str, config: dict):
        self.job_id = job_id
        self.config = config
        self.visited_urls: Set[str] = set()
        self.to_visit: List[str] = []
        self.domain_cache = {}
        self.playwright = None
        self.browser = None
        
    async def initialize(self):
        """Initialize playwright browser for JavaScript rendering"""
        if self.config.get("render_javascript", False):
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=True)
    
    async def close(self):
        """Clean up resources"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    def normalize_url(self, url: str, base_url: str = None) -> str:
        """Normalize URL by removing fragments and normalizing path"""
        if base_url:
            url = urljoin(base_url, url)
        
        parsed = urlparse(url)
        # Remove fragments and normalize
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if parsed.query:
            normalized += f"?{parsed.query}"
        
        return normalized.rstrip('/')
    
    def extract_links(self, html: str, base_url: str) -> Set[str]:
        """Extract all links from HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            if href.startswith('#') or href.startswith('javascript:'):
                continue
            
            full_url = self.normalize_url(href, base_url)
            
            # Filter by domain
            if self.config.get("same_domain_only", True):
                base_domain = tldextract.extract(base_url).domain
                link_domain = tldextract.extract(full_url).domain
                if base_domain != link_domain:
                    continue
            
            links.add(full_url)
        
        return links
    
    async def fetch_with_requests(self, url: str) -> Optional[str]:
        """Fetch URL using requests/aiohttp"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=30, headers={
                    'User-Agent': 'AI-Ready-Crawler/1.0'
                }) as response:
                    if response.status == 200:
                        return await response.text()
                    else:
                        logger.warning(f"Failed to fetch {url}: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
    
    async def fetch_with_playwright(self, url: str) -> Optional[str]:
        """Fetch URL using Playwright for JavaScript-rendered content"""
        try:
            page = await self.browser.new_page()
            await page.goto(url, wait_until='networkidle', timeout=30000)
            content = await page.content()
            await page.close()
            return content
        except Exception as e:
            logger.error(f"Error fetching {url} with Playwright: {e}")
            return None
    
    async def extract_content(self, html: str, url: str) -> dict:
        """Extract clean content from HTML"""
        # Extract main content using trafilatura
        extracted = trafilatura.extract(
            html,
            include_comments=False,
            include_tables=True,
            include_images=False,
            include_links=False,
            output_format='json',
            url=url
        )
        
        if extracted:
            import json
            content = json.loads(extracted)
        else:
            # Fallback to BeautifulSoup extraction
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove unwanted elements
            for element in soup.find_all(['script', 'style', 'nav', 'footer', 'header', 'aside']):
                element.decompose()
            
            # Extract title
            title = soup.title.string if soup.title else ''
            
            # Extract main content
            main_content = soup.find('main') or soup.find('article') or soup.find('body')
            text = main_content.get_text(separator=' ', strip=True) if main_content else ''
            
            content = {
                'title': title,
                'text': text,
                'source_url': url
            }
        
        return content
    
    async def crawl_url(self, url: str, depth: int) -> Optional[dict]:
        """Crawl a single URL and extract content"""
        if url in self.visited_urls:
            return None
        
        # Check robots.txt
        if self.config.get("respect_robots", True):
            domain = urlparse(url).netloc
            if domain not in self.domain_cache:
                self.domain_cache[domain] = await check_robots_txt(url)
            
            if not is_allowed(self.domain_cache[domain], url):
                logger.info(f"Skipping {url} (disallowed by robots.txt)")
                return None
        
        logger.info(f"Crawling {url} at depth {depth}")
        
        # Fetch content
        if self.config.get("render_javascript", False) and self.browser:
            html = await self.fetch_with_playwright(url)
        else:
            html = await self.fetch_with_requests(url)
        
        if not html:
            return None
        
        # Extract content
        content = await self.extract_content(html, url)
        
        # Extract links for further crawling
        links = self.extract_links(html, url)
        
        self.visited_urls.add(url)
        
        return {
            'url': url,
            'html': html,
            'content': content,
            'links': links,
            'depth': depth
        }
    
    async def crawl(self, seed_urls: List[str], max_depth: int, max_pages: int):
        """Main crawling logic"""
        await self.initialize()
        
        self.to_visit = [(url, 0) for url in seed_urls]
        
        pages_crawled = 0
        
        while self.to_visit and pages_crawled < max_pages:
            url, depth = self.to_visit.pop(0)
            
            if depth > max_depth:
                continue
            
            result = await self.crawl_url(url, depth)
            
            if result:
                pages_crawled += 1
                yield result
                
                # Add new links to queue
                if depth < max_depth:
                    for link in result['links']:
                        if link not in self.visited_urls:
                            self.to_visit.append((link, depth + 1))
        
        await self.close()