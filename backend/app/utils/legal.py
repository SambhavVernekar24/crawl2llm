import aiohttp
from urllib.parse import urlparse
import re
from typing import Optional, Dict
import logging
from urllib.robotparser import RobotFileParser
from urllib.request import urlopen
import tldextract

logger = logging.getLogger(__name__)

class RobotsChecker:
    def __init__(self):
        self.parsers: Dict[str, RobotFileParser] = {}
    
    async def get_robots_parser(self, url: str) -> Optional[RobotFileParser]:
        """Get robots.txt parser for a domain"""
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        if base_url in self.parsers:
            return self.parsers[base_url]
        
        try:
            robots_url = f"{base_url}/robots.txt"
            parser = RobotFileParser(robots_url)
            parser.read()
            self.parsers[base_url] = parser
            return parser
        except Exception as e:
            logger.warning(f"Failed to fetch robots.txt for {base_url}: {e}")
            return None
    
    def is_allowed(self, parser: RobotFileParser, url: str, user_agent: str = "*") -> bool:
        """Check if URL is allowed by robots.txt"""
        if parser:
            return parser.can_fetch(user_agent, url)
        return True  # If no robots.txt, assume allowed

class LicenseDetector:
    def __init__(self):
        self.license_patterns = {
            'mit': r'mit\s+license',
            'apache': r'apache\s+license',
            'gpl': r'gpl|gnu\s+general\s+public\s+license',
            'bsd': r'bsd\s+license',
            'cc': r'creative\s+commons',
            'copyright': r'copyright\s+©?\s*\d{4}',
            'public_domain': r'public\s+domain'
        }
    
    def detect_license(self, text: str) -> Dict[str, bool]:
        """Detect licenses mentioned in text"""
        text_lower = text.lower()
        results = {}
        
        for license_name, pattern in self.license_patterns.items():
            results[license_name] = bool(re.search(pattern, text_lower))
        
        return results

class PrivacyFilter:
    def __init__(self):
        self.sensitive_patterns = [
            r'\b\d{3}[-.]?\d{2}[-.]?\d{4}\b',  # SSN
            r'\b\d{16}\b',  # Credit card
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # Phone
            r'\b\d{5}(-\d{4})?\b',  # ZIP code
        ]
    
    def filter_sensitive(self, text: str) -> str:
        """Remove or mask sensitive information"""
        filtered = text
        
        for pattern in self.sensitive_patterns:
            filtered = re.sub(pattern, '[REDACTED]', filtered)
        
        return filtered
    
    def contains_sensitive(self, text: str) -> bool:
        """Check if text contains sensitive information"""
        for pattern in self.sensitive_patterns:
            if re.search(pattern, text):
                return True
        return False

# Global instances
robots_checker = RobotsChecker()
license_detector = LicenseDetector()
privacy_filter = PrivacyFilter()

async def check_robots_txt(url: str):
    """Check robots.txt for a URL"""
    return await robots_checker.get_robots_parser(url)

def is_allowed(parser, url: str) -> bool:
    """Check if URL is allowed"""
    return robots_checker.is_allowed(parser, url)

def detect_license(text: str) -> Dict[str, bool]:
    """Detect licenses in text"""
    return license_detector.detect_license(text)

def filter_privacy(text: str) -> str:
    """Filter sensitive information"""
    return privacy_filter.filter_sensitive(text)