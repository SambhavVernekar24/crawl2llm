from typing import Dict, Any, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ContentTagger:
    def __init__(self):
        self.topics = [
            'technology', 'business', 'science', 'health',
            'education', 'entertainment', 'sports', 'politics',
            'programming', 'ai', 'data-science', 'web-development'
        ]
        
        self.keyword_patterns = {
            'programming': ['python', 'javascript', 'java', 'code', 'function', 'class'],
            'ai': ['machine learning', 'artificial intelligence', 'neural network', 'deep learning'],
            'data-science': ['data', 'analysis', 'statistics', 'pandas', 'numpy'],
            'web-development': ['html', 'css', 'react', 'vue', 'angular', 'web'],
        }
    
    def extract_topics(self, text: str, confidence_threshold: float = 0.5) -> List[Dict[str, Any]]:
        """Extract main topics from text"""
        text_lower = text.lower()
        topics_found = []
        
        for topic, keywords in self.keyword_patterns.items():
            matches = sum(1 for keyword in keywords if keyword in text_lower)
            if matches > 0:
                confidence = min(matches / len(keywords), 1.0)
                if confidence >= confidence_threshold:
                    topics_found.append({
                        'topic': topic,
                        'confidence': confidence
                    })
        
        # Sort by confidence
        topics_found.sort(key=lambda x: x['confidence'], reverse=True)
        
        return topics_found
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities (simplified version)"""
        import re
        
        entities = {
            'urls': re.findall(r'https?://[^\s]+', text),
            'emails': re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', text),
            'dates': re.findall(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text),
            'numbers': re.findall(r'\b\d+\b', text),
        }
        
        return entities
    
    def detect_language(self, text: str) -> str:
        """Detect text language"""
        try:
            from langdetect import detect
            return detect(text)
        except:
            return 'en'
    
    def assess_readability(self, text: str) -> Dict[str, float]:
        """Calculate readability scores"""
        words = text.split()
        sentences = text.split('.')
        
        avg_word_length = sum(len(w) for w in words) / max(len(words), 1)
        avg_sentence_length = len(words) / max(len(sentences), 1)
        
        return {
            'word_count': len(words),
            'sentence_count': len(sentences),
            'avg_word_length': avg_word_length,
            'avg_sentence_length': avg_sentence_length,
            'readability_score': 100 - (avg_word_length * avg_sentence_length / 10)
        }
    
    def tag_content(self, text: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate comprehensive tags for content"""
        tags = {
            'topics': self.extract_topics(text),
            'entities': self.extract_entities(text),
            'language': self.detect_language(text),
            'readability': self.assess_readability(text),
            'timestamp': datetime.utcnow().isoformat(),
        }
        
        if metadata:
            tags['metadata'] = metadata
        
        return tags