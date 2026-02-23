import json
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from typing import Dict, Any, List
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DataExporter:
    def __init__(self, job_id: str, config: Dict[str, Any]):
        self.job_id = job_id
        self.config = config
        self.output_format = config.get("output_format", "jsonl")
        self.output_dir = f"output/{job_id}"
        self.data_buffer = []
        self.buffer_size = 100  # Flush after 100 items
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize files based on format
        self.init_export_files()
    
    def init_export_files(self):
        """Initialize export files"""
        if self.output_format == "jsonl":
            self.jsonl_file = open(f"{self.output_dir}/data.jsonl", 'w', encoding='utf-8')
        elif self.output_format == "csv":
            self.csv_file = open(f"{self.output_dir}/data.csv", 'w', encoding='utf-8')
            # Write header later when we get first item
            self.csv_header_written = False
        elif self.output_format == "parquet":
            self.parquet_path = f"{self.output_dir}/data.parquet"
            self.parquet_writer = None
    
    def format_for_llm(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format data for LLM training"""
        return {
            "text": data.get('text', ''),
            "source_url": data.get('url', ''),
            "title": data.get('title', ''),
            "topic": data.get('topic', 'general'),
            "trust_score": data.get('trust_score', 0.5),
            "word_count": data.get('metadata', {}).get('word_count', 0),
            "extracted_at": datetime.utcnow().isoformat(),
            "embedding_ready": True,
            "chunks": data.get('chunks', []),
            "metadata": data.get('metadata', {})
        }
    
    def format_for_rag(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format data for RAG systems"""
        # LangChain compatible format
        return {
            "page_content": data.get('text', ''),
            "metadata": {
                "source": data.get('url', ''),
                "title": data.get('title', ''),
                "topic": data.get('topic', 'general'),
                "chunk_index": 0,
                "total_chunks": len(data.get('chunks', []))
            }
        }
    
    async def export_chunk(self, data: Dict[str, Any]):
        """Export a single data chunk"""
        if self.config.get("rag", False):
            formatted = self.format_for_rag(data)
        else:
            formatted = self.format_for_llm(data)
        
        self.data_buffer.append(formatted)
        
        if len(self.data_buffer) >= self.buffer_size:
            self.flush_buffer()
    
    def flush_buffer(self):
        """Flush buffer to disk"""
        if not self.data_buffer:
            return
        
        try:
            if self.output_format == "jsonl":
                for item in self.data_buffer:
                    self.jsonl_file.write(json.dumps(item) + '\n')
                self.jsonl_file.flush()
            
            elif self.output_format == "csv":
                df = pd.DataFrame(self.data_buffer)
                if not self.csv_header_written:
                    df.to_csv(self.csv_file, index=False)
                    self.csv_header_written = True
                else:
                    df.to_csv(self.csv_file, mode='a', header=False, index=False)
                self.csv_file.flush()
            
            elif self.output_format == "parquet":
                df = pd.DataFrame(self.data_buffer)
                table = pa.Table.from_pandas(df)
                
                if self.parquet_writer is None:
                    self.parquet_writer = pq.ParquetWriter(self.parquet_path, table.schema)
                
                self.parquet_writer.write_table(table)
            
            logger.info(f"Flushed {len(self.data_buffer)} items to {self.output_format}")
            self.data_buffer.clear()
            
        except Exception as e:
            logger.error(f"Error flushing buffer: {e}")
    
    def finalize(self):
        """Finalize export and close files"""
        # Flush any remaining data
        self.flush_buffer()
        
        # Close files
        if self.output_format == "jsonl":
            self.jsonl_file.close()
        elif self.output_format == "csv":
            self.csv_file.close()
        elif self.output_format == "parquet" and self.parquet_writer:
            self.parquet_writer.close()
        
        # Create manifest file
        self.create_manifest()
        
        logger.info(f"Export finalized for job {self.job_id}")
    
    def create_manifest(self):
        """Create a manifest file with export metadata"""
        manifest = {
            "job_id": self.job_id,
            "exported_at": datetime.utcnow().isoformat(),
            "format": self.output_format,
            "config": self.config,
            "total_items": self.pages_processed,
            "files": [f for f in os.listdir(self.output_dir) if f.startswith('data.')]
        }
        
        with open(f"{self.output_dir}/manifest.json", 'w') as f:
            json.dump(manifest, f, indent=2)