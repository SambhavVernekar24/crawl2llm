import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any
import hashlib
import logging

logger = logging.getLogger(__name__)

class Deduplicator:
    def __init__(self, similarity_threshold: float = 0.95):
        self.similarity_threshold = similarity_threshold
        self.seen_hashes = set()
        self.seen_embeddings = []
        self.seen_contents = []
    
    def text_hash(self, text: str) -> str:
        """Create a hash of the text for exact deduplication"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    def is_duplicate_exact(self, text: str) -> bool:
        """Check for exact duplicates using hash"""
        text_hash = self.text_hash(text)
        
        if text_hash in self.seen_hashes:
            return True
        
        self.seen_hashes.add(text_hash)
        return False
    
    def is_duplicate_semantic(self, embedding: List[float], text: str) -> bool:
        """Check for semantic duplicates using embeddings"""
        if not embedding or len(self.seen_embeddings) == 0:
            return False
        
        # Convert to numpy array
        emb = np.array(embedding).reshape(1, -1)
        
        # Compute similarities with all seen embeddings
        similarities = cosine_similarity(emb, np.array(self.seen_embeddings))
        max_similarity = similarities.max() if similarities.size > 0 else 0
        
        if max_similarity > self.similarity_threshold:
            logger.info(f"Semantic duplicate found (similarity: {max_similarity:.2f})")
            return True
        
        # Add to seen embeddings
        self.seen_embeddings.append(embedding)
        self.seen_contents.append(text)
        
        return False
    
    def deduplicate_chunks(self, chunks: List[str], embeddings: List[List[float]]) -> List[str]:
        """Deduplicate chunks within a single document"""
        unique_chunks = []
        seen_hashes = set()
        
        for i, chunk in enumerate(chunks):
            chunk_hash = self.text_hash(chunk)
            
            if chunk_hash not in seen_hashes:
                seen_hashes.add(chunk_hash)
                unique_chunks.append(chunk)
        
        return unique_chunks
    
    def reset(self):
        """Reset the deduplicator state"""
        self.seen_hashes.clear()
        self.seen_embeddings.clear()
        self.seen_contents.clear()