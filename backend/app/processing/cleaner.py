import re
import html
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class TextCleaner:
    def __init__(self):
        self.boilerplate_patterns = [
            r'copyright\s+©?\s*\d{4}.*?(?=\n)',
            r'terms?\s+of\s+service',
            r'privacy\s+policy',
            r'cookie\s+policy',
            r'all\s+rights\s+reserved',
            r'contact\s+us',
            r'subscribe\s+to\s+our\s+newsletter',
            r'follow\s+us\s+on',
        ]
    
    def clean_html_entities(self, text: str) -> str:
        """Convert HTML entities to characters"""
        return html.unescape(text)
    
    def remove_boilerplate(self, text: str) -> str:
        """Remove common boilerplate text"""
        cleaned = text
        for pattern in self.boilerplate_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        return cleaned
    
    def normalize_whitespace(self, text: str) -> str:
        """Normalize whitespace"""
        # Replace multiple newlines with double newline
        text = re.sub(r'\n\s*\n', '\n\n', text)
        # Replace multiple spaces with single space
        text = re.sub(r' +', ' ', text)
        # Remove spaces at start/end of lines
        text = re.sub(r'^\s+|\s+$', '', text, flags=re.MULTILINE)
        return text.strip()
    
    def remove_special_characters(self, text: str, keep_punctuation: bool = True) -> str:
        """Remove or replace special characters"""
        if keep_punctuation:
            # Keep alphanumeric, spaces, and basic punctuation
            text = re.sub(r'[^\w\s\.\,\!\?\-\:\;\'\"\(\)]', '', text)
        else:
            # Keep only alphanumeric and spaces
            text = re.sub(r'[^\w\s]', '', text)
        return text
    
    def clean(self, text: str, config: Dict[str, Any] = None) -> str:
        """Main cleaning method"""
        if not text:
            return ""
        
        config = config or {}
        
        # Apply cleaning steps
        cleaned = self.clean_html_entities(text)
        cleaned = self.remove_boilerplate(cleaned)
        cleaned = self.normalize_whitespace(cleaned)
        
        if config.get('remove_special_chars', False):
            cleaned = self.remove_special_characters(
                cleaned, 
                config.get('keep_punctuation', True)
            )
        
        return cleaned