import hashlib
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
import re
from transformers import pipeline

logger = logging.getLogger(__name__)

class ContentProcessor:
    def __init__(self, config: dict):
        self.config = config
        self.embedding_model = None
        self.classifier = None
        self.vectorizer = TfidfVectorizer(max_features=1000)
        
        # Initialize models if needed
        if config.get("enable_deduplication", True):
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        if config.get("topic_classification", True):
            self.classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli"
            )
        
        self.topics = [
            "technology", "business", "science", "health", 
            "education", "entertainment", "sports", "politics",
            "general"
        ]
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\-\:\;]', '', text)
        
        # Remove repeated punctuation
        text = re.sub(r'([.!?]){2,}', r'\1', text)
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        
        return text.strip()
    
    def chunk_text(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        if len(words) <= chunk_size:
            return [text]
        
        step = chunk_size - overlap
        for i in range(0, len(words), step):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        
        return chunks
    
    def compute_embedding(self, text: str) -> List[float]:
        """Compute embedding for text"""
        if self.embedding_model:
            embedding = self.embedding_model.encode(text)
            return embedding.tolist()
        return []
    
    def classify_topic(self, text: str) -> str:
        """Classify the topic of the text"""
        if self.classifier and len(text) > 50:
            try:
                # Take first 500 chars for classification
                sample = text[:500]
                result = self.classifier(sample, self.topics)
                return result['labels'][0]
            except Exception as e:
                logger.error(f"Topic classification failed: {e}")
        
        # Simple keyword-based fallback
        text_lower = text.lower()
        for topic in self.topics:
            if topic in text_lower:
                return topic
        
        return "general"
    
    def compute_trust_score(self, content: Dict[str, Any]) -> float:
        """Compute trust score for content"""
        score = 0.5  # Base score
        
        # Check for domain authority (simplified)
        url = content.get('url', '')
        if any(domain in url for domain in ['.edu', '.gov', '.org']):
            score += 0.2
        
        # Check content quality
        text = content.get('text', '')
        word_count = len(text.split())
        
        if word_count > 1000:
            score += 0.15
        elif word_count > 500:
            score += 0.1
        elif word_count < 50:
            score -= 0.2
        
        # Check for proper structure
        sentences = text.split('.')
        avg_sentence_length = np.mean([len(s.split()) for s in sentences if s.strip()])
        
        if 10 <= avg_sentence_length <= 25:
            score += 0.1
        elif avg_sentence_length > 40 or avg_sentence_length < 5:
            score -= 0.1
        
        # Normalize to [0, 1]
        return max(0, min(1, score))
    
    def extract_metadata(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Extract additional metadata"""
        text = content.get('text', '')
        
        metadata = {
            'word_count': len(text.split()),
            'char_count': len(text),
            'sentence_count': len([s for s in text.split('.') if s.strip()]),
            'has_code': bool(re.search(r'```|function|class|def ', text)),
            'has_list': bool(re.search(r'^\s*[\*\-\+]', text, re.MULTILINE)),
            'has_table': bool(re.search(r'\|.*\|', text)),
        }
        
        return metadata
    
    def process(self, crawled_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process crawled data into AI-ready format"""
        try:
            # Extract content
            content = crawled_data.get('content', {})
            raw_text = content.get('text', '')
            
            # Clean text
            cleaned_text = self.clean_text(raw_text)
            
            # Chunk text
            chunks = self.chunk_text(
                cleaned_text,
                self.config.get("chunk_size", 512),
                self.config.get("chunk_overlap", 50)
            )
            
            # Classify topic
            topic = self.classify_topic(cleaned_text)
            
            # Compute trust score
            trust_score = self.compute_trust_score({
                'url': crawled_data['url'],
                'text': cleaned_text
            })
            
            # Extract metadata
            metadata = self.extract_metadata({
                'text': cleaned_text,
                'url': crawled_data['url']
            })
            
            # Compute embedding for first chunk (for deduplication)
            embedding = self.compute_embedding(chunks[0]) if chunks else []
            
            result = {
                'url': crawled_data['url'],
                'title': content.get('title', ''),
                'text': cleaned_text,
                'chunks': chunks,
                'topic': topic,
                'trust_score': trust_score,
                'embedding': embedding,
                'metadata': metadata,
                'crawled_at': crawled_data.get('crawled_at')
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Content processing failed: {e}")
            return None