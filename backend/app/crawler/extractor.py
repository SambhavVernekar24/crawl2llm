import re
import json
from typing import Dict, Any, Optional, List
from bs4 import BeautifulSoup
import trafilatura
from urllib.parse import urlparse
import logging
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)

class ContentExtractor:
    """
    Advanced content extractor that cleans and structures web content
    """
    
    def __init__(self):
        self.boilerplate_selectors = [
            'script', 'style', 'nav', 'footer', 'header', 'aside',
            '.advertisement', '.ad', '.sidebar', '.comments', '.menu',
            '.navigation', '.breadcrumb', '.pagination', '.share-buttons',
            '#footer', '#header', '#sidebar', '#comments', '#navigation'
        ]
        
        self.content_selectors = [
            'article', 'main', '.content', '.post-content', '.article-content',
            '.entry-content', '#content', '.main-content', '.post-body'
        ]
    
    def extract_with_trafilatura(self, html: str, url: str) -> Optional[Dict[str, Any]]:
        """Extract content using trafilatura"""
        try:
            extracted = trafilatura.extract(
                html,
                include_comments=False,
                include_tables=True,
                include_images=False,
                include_links=False,
                output_format='json',
                url=url,
                favor_precision=True,
                include_formatting=True
            )
            
            if extracted:
                return json.loads(extracted)
        except Exception as e:
            logger.error(f"Trafilatura extraction failed: {e}")
        
        return None
    
    def extract_with_beautifulsoup(self, html: str, url: str) -> Dict[str, Any]:
        """Extract content using BeautifulSoup as fallback"""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove boilerplate elements
        for selector in self.boilerplate_selectors:
            for element in soup.select(selector):
                element.decompose()
        
        # Try to find main content
        main_content = None
        for selector in self.content_selectors:
            main_content = soup.select_one(selector)
            if main_content:
                break
        
        if not main_content:
            # Fallback to body
            main_content = soup.body
        
        if not main_content:
            main_content = soup
        
        # Extract title
        title = None
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text(strip=True)
        
        # Extract meta description
        description = None
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            description = meta_desc['content']
        
        # Extract author if available
        author = None
        author_meta = soup.find('meta', attrs={'name': 'author'})
        if author_meta and author_meta.get('content'):
            author = author_meta['content']
        
        # Extract publication date
        date = None
        date_meta = soup.find('meta', attrs={'name': 'pubdate'}) or \
                   soup.find('meta', attrs={'property': 'article:published_time'})
        if date_meta and date_meta.get('content'):
            date = date_meta['content']
        
        # Clean the text
        text = main_content.get_text(separator=' ', strip=True)
        text = re.sub(r'\s+', ' ', text)
        
        return {
            'title': title,
            'text': text,
            'description': description,
            'author': author,
            'date': date,
            'source_url': url
        }
    
    def extract_metadata(self, html: str, url: str) -> Dict[str, Any]:
        """Extract metadata from HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        metadata = {}
        
        # Extract meta tags
        for meta in soup.find_all('meta'):
            if meta.get('name'):
                metadata[meta['name']] = meta.get('content', '')
            elif meta.get('property'):
                metadata[meta['property']] = meta.get('content', '')
        
        # Extract Open Graph tags
        og_tags = {}
        for meta in soup.find_all('meta', property=re.compile(r'^og:')):
            og_tags[meta['property']] = meta.get('content', '')
        
        if og_tags:
            metadata['og'] = og_tags
        
        # Extract Twitter cards
        twitter_tags = {}
        for meta in soup.find_all('meta', attrs={'name': re.compile(r'^twitter:')}):
            twitter_tags[meta['name']] = meta.get('content', '')
        
        if twitter_tags:
            metadata['twitter'] = twitter_tags
        
        # Extract JSON-LD
        json_ld = []
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)
                json_ld.append(data)
            except:
                pass
        
        if json_ld:
            metadata['json_ld'] = json_ld
        
        return metadata
    
    def extract_links(self, html: str, base_url: str) -> List[Dict[str, str]]:
        """Extract all links with their text"""
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        
        for a in soup.find_all('a', href=True):
            href = a['href']
            text = a.get_text(strip=True)
            
            # Skip empty or javascript links
            if not href or href.startswith('javascript:'):
                continue
            
            # Convert relative URLs to absolute
            if href.startswith('/'):
                parsed_base = urlparse(base_url)
                href = f"{parsed_base.scheme}://{parsed_base.netloc}{href}"
            elif not href.startswith(('http://', 'https://')):
                continue
            
            links.append({
                'url': href,
                'text': text[:100] if text else '',
                'nofollow': 'rel' in a.attrs and 'nofollow' in a['rel']
            })
        
        return links
    
    def extract_images(self, html: str, base_url: str) -> List[Dict[str, str]]:
        """Extract image information"""
        soup = BeautifulSoup(html, 'html.parser')
        images = []
        
        for img in soup.find_all('img', src=True):
            src = img['src']
            alt = img.get('alt', '')
            
            # Convert relative URLs to absolute
            if src.startswith('/'):
                parsed_base = urlparse(base_url)
                src = f"{parsed_base.scheme}://{parsed_base.netloc}{src}"
            elif not src.startswith(('http://', 'https://')):
                continue
            
            images.append({
                'url': src,
                'alt': alt,
                'title': img.get('title', '')
            })
        
        return images
    
    def extract_headings(self, html: str) -> Dict[str, List[str]]:
        """Extract headings structure"""
        soup = BeautifulSoup(html, 'html.parser')
        headings = {
            'h1': [],
            'h2': [],
            'h3': [],
            'h4': [],
            'h5': [],
            'h6': []
        }
        
        for level in headings.keys():
            for heading in soup.find_all(level):
                text = heading.get_text(strip=True)
                if text:
                    headings[level].append(text)
        
        return headings
    
    def calculate_content_hash(self, text: str) -> str:
        """Calculate hash of content for deduplication"""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    def extract(self, html: str, url: str, use_trafilatura: bool = True) -> Dict[str, Any]:
        """
        Main extraction method that combines all extractors
        """
        result = {
            'url': url,
            'domain': urlparse(url).netloc,
            'extracted_at': datetime.utcnow().isoformat(),
            'content_hash': None
        }
        
        # Try trafilatura first if enabled
        if use_trafilatura:
            trafilatura_result = self.extract_with_trafilatura(html, url)
            if trafilatura_result:
                result.update(trafilatura_result)
            else:
                # Fallback to BeautifulSoup
                bs_result = self.extract_with_beautifulsoup(html, url)
                result.update(bs_result)
        else:
            bs_result = self.extract_with_beautifulsoup(html, url)
            result.update(bs_result)
        
        # Add additional metadata
        result['metadata'] = self.extract_metadata(html, url)
        result['links'] = self.extract_links(html, url)
        result['images'] = self.extract_images(html, url)
        result['headings'] = self.extract_headings(html)
        
        # Calculate content hash for deduplication
        if result.get('text'):
            result['content_hash'] = self.calculate_content_hash(result['text'])
        
        # Basic statistics
        if result.get('text'):
            words = result['text'].split()
            sentences = result['text'].split('.')
            result['stats'] = {
                'word_count': len(words),
                'character_count': len(result['text']),
                'sentence_count': len([s for s in sentences if s.strip()]),
                'avg_word_length': sum(len(w) for w in words) / len(words) if words else 0,
                'avg_sentence_length': len(words) / len(sentences) if sentences else 0
            }
        
        return result
    
    def extract_batch(self, html_pages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Extract content from multiple pages
        """
        results = []
        for page in html_pages:
            try:
                result = self.extract(page['html'], page['url'])
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to extract from {page['url']}: {e}")
                results.append({
                    'url': page['url'],
                    'error': str(e),
                    'extracted_at': datetime.utcnow().isoformat()
                })
        
        return results