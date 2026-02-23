import faiss
import numpy as np
from typing import List, Dict, Any, Optional
import pickle
import os
import logging

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, dimension: int = 384, index_path: str = None):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.metadata: List[Dict[str, Any]] = []
        self.index_path = index_path or './data/vector_store.faiss'
        
        # Load existing index if available
        if os.path.exists(self.index_path):
            self.load()
    
    def add_vectors(self, vectors: List[List[float]], metadata_list: List[Dict[str, Any]]):
        """Add vectors to the index"""
        if not vectors:
            return
        
        vectors_np = np.array(vectors).astype('float32')
        self.index.add(vectors_np)
        self.metadata.extend(metadata_list)
        
        logger.info(f"Added {len(vectors)} vectors to store")
    
    def search(self, query_vector: List[float], k: int = 10) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        query_np = np.array([query_vector]).astype('float32')
        distances, indices = self.index.search(query_np, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.metadata):
                results.append({
                    'metadata': self.metadata[idx],
                    'distance': float(distances[0][i]),
                    'similarity': 1 / (1 + float(distances[0][i]))
                })
        
        return results
    
    def delete(self, ids: List[int]):
        """Delete vectors by index"""
        # FAISS doesn't support deletion directly, so we need to rebuild
        keep_indices = [i for i in range(len(self.metadata)) if i not in ids]
        self.rebuild(keep_indices)
    
    def rebuild(self, keep_indices: List[int]):
        """Rebuild index with only specified indices"""
        if not keep_indices:
            self.index.reset()
            self.metadata = []
            return
        
        # Extract vectors to keep
        vectors = []
        metadata = []
        for idx in keep_indices:
            # This is a simplification - you'd need to store vectors separately
            vectors.append(self.get_vector_by_index(idx))
            metadata.append(self.metadata[idx])
        
        # Rebuild index
        self.index.reset()
        self.add_vectors(vectors, metadata)
    
    def get_vector_by_index(self, idx: int) -> List[float]:
        """Retrieve vector by index (placeholder)"""
        # In practice, you'd need to store vectors separately
        # This is a simplified version
        return []
    
    def save(self):
        """Save index to disk"""
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        
        # Save FAISS index
        faiss.write_index(self.index, self.index_path)
        
        # Save metadata
        metadata_path = self.index_path.replace('.faiss', '_metadata.pkl')
        with open(metadata_path, 'wb') as f:
            pickle.dump(self.metadata, f)
        
        logger.info(f"Saved vector store to {self.index_path}")
    
    def load(self):
        """Load index from disk"""
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            
            metadata_path = self.index_path.replace('.faiss', '_metadata.pkl')
            if os.path.exists(metadata_path):
                with open(metadata_path, 'rb') as f:
                    self.metadata = pickle.load(f)
            
            logger.info(f"Loaded vector store with {self.index.ntotal} vectors")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        return {
            'total_vectors': self.index.ntotal,
            'dimension': self.dimension,
            'metadata_count': len(self.metadata),
            'index_type': type(self.index).__name__
        }