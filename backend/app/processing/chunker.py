from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class TextChunker:
    def __init__(self, chunk_size: int = 512, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap
    
    def chunk_by_tokens(self, text: str, chunk_size: int = None, overlap: int = None) -> List[str]:
        """Split text into chunks based on token count"""
        chunk_size = chunk_size or self.chunk_size
        overlap = overlap or self.overlap
        
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
    
    def chunk_by_sentences(self, text: str, max_sentences: int = 10) -> List[str]:
        """Split text into chunks based on sentences"""
        import nltk
        try:
            sentences = nltk.sent_tokenize(text)
        except:
            # Fallback to simple splitting
            sentences = text.split('. ')
        
        chunks = []
        current_chunk = []
        
        for sentence in sentences:
            current_chunk.append(sentence)
            if len(current_chunk) >= max_sentences:
                chunks.append('. '.join(current_chunk))
                current_chunk = []
        
        if current_chunk:
            chunks.append('. '.join(current_chunk))
        
        return chunks
    
    def chunk_by_paragraphs(self, text: str, max_paragraphs: int = 3) -> List[str]:
        """Split text into chunks based on paragraphs"""
        paragraphs = text.split('\n\n')
        chunks = []
        
        for i in range(0, len(paragraphs), max_paragraphs):
            chunk = '\n\n'.join(paragraphs[i:i + max_paragraphs])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks
    
    def chunk_semantic(self, text: str, embedding_model=None) -> List[str]:
        """Split text into semantically coherent chunks"""
        # This would use embeddings to find natural break points
        # For now, fall back to token-based chunking
        return self.chunk_by_tokens(text)