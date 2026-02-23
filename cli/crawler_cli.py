#!/usr/bin/env python3
"""
AI-Ready Web Crawler CLI
Command-line interface for the AI-Ready Web Crawler
"""

import click
import requests
import json
import sys
import os
from datetime import datetime
from typing import Optional
import time

API_URL = os.getenv('CRAWLER_API_URL', 'http://localhost:8000/api/v1')

@click.group()
def cli():
    """AI-Ready Web Crawler - Convert websites into LLM-ready datasets"""
    pass

@cli.command()
@click.argument('urls', nargs=-1, required=True)
@click.option('--depth', '-d', default=3, help='Maximum crawl depth')
@click.option('--max-pages', '-m', default=100, help='Maximum pages to crawl')
@click.option('--output', '-o', default='jsonl', type=click.Choice(['jsonl', 'parquet', 'csv']), 
              help='Output format')
@click.option('--chunk-size', '-c', default=512, help='Chunk size for text splitting')
@click.option('--no-dedupe', is_flag=True, help='Disable deduplication')
@click.option('--no-topic', is_flag=True, help='Disable topic classification')
@click.option('--no-privacy', is_flag=True, help='Disable privacy filtering')
@click.option('--respect-robots/--ignore-robots', default=True, help='Respect robots.txt')
@click.option('--wait', '-w', is_flag=True, help='Wait for job completion')
@click.option('--output-dir', default='./output', help='Output directory')
def crawl(urls, depth, max_pages, output, chunk_size, no_dedupe, no_topic, 
          no_privacy, respect_robots, wait, output_dir):
    """Start a new crawl job with the specified URLs"""
    
    config = {
        'seed_urls': list(urls),
        'max_depth': depth,
        'max_pages': max_pages,
        'output_format': output,
        'chunk_size': chunk_size,
        'enable_deduplication': not no_dedupe,
        'topic_classification': not no_topic,
        'privacy_filter': not no_privacy,
        'respect_robots': respect_robots,
    }
    
    click.echo(f"🚀 Starting crawl job with {len(urls)} seed URLs...")
    click.echo(f"Configuration: {json.dumps(config, indent=2)}")
    
    try:
        # Start the crawl
        response = requests.post(f"{API_URL}/crawl", json=config)
        response.raise_for_status()
        job = response.json()
        
        job_id = job['job_id']
        click.echo(f"✅ Job started successfully!")
        click.echo(f"📋 Job ID: {job_id}")
        
        if wait:
            click.echo(f"⏳ Waiting for job to complete...")
            monitor_job(job_id, output_dir)
        else:
            click.echo(f"\nTo check status: crawler status {job_id}")
            click.echo(f"To download results: crawler download {job_id}")
            
    except requests.exceptions.RequestException as e:
        click.echo(f"❌ Error starting crawl: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.argument('job_id')
def status(job_id):
    """Get status of a crawl job"""
    try:
        response = requests.get(f"{API_URL}/jobs/{job_id}")
        response.raise_for_status()
        job = response.json()
        
        click.echo(f"\n📊 Job Status: {job_id}")
        click.echo(f"{'='*50}")
        click.echo(f"Status: {job['status'].upper()}")
        click.echo(f"Pages: {job['pages_crawled']} / {job['total_pages']}")
        click.echo(f"Started: {job['created_at']}")
        click.echo(f"Last Updated: {job['updated_at']}")
        
        if job.get('error'):
            click.echo(f"Error: {job['error']}")
        
        # Get detailed stats
        stats_response = requests.get(f"{API_URL}/jobs/{job_id}/stats")
        if stats_response.status_code == 200:
            stats = stats_response.json()
            click.echo(f"\n📈 Statistics:")
            click.echo(f"  Chunks Created: {stats['chunks_created']}")
            click.echo(f"  Unique Content: {stats['unique_content_percentage']:.1f}%")
            click.echo(f"  Avg Trust Score: {stats['avg_trust_score']:.2f}")
            click.echo(f"\n  Topics:")
            for topic, count in stats['topics_distribution'].items():
                click.echo(f"    {topic}: {count}")
                
    except requests.exceptions.RequestException as e:
        click.echo(f"❌ Error getting status: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.argument('job_id')
@click.option('--format', '-f', default='jsonl', help='Output format')
@click.option('--output', '-o', help='Output file path')
@click.option('--limit', '-l', default=1000, help='Maximum number of records')
def download(job_id, format, output, limit):
    """Download the extracted dataset"""
    try:
        if not output:
            output = f"crawl_{job_id}.{format}"
        
        response = requests.get(
            f"{API_URL}/jobs/{job_id}/download/{format}",
            params={'limit': limit},
            stream=True
        )
        response.raise_for_status()
        
        with open(output, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        click.echo(f"✅ Dataset downloaded to: {output}")
        
    except requests.exceptions.RequestException as e:
        click.echo(f"❌ Error downloading: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.argument('job_id')
def stop(job_id):
    """Stop a running crawl job"""
    try:
        response = requests.post(f"{API_URL}/jobs/{job_id}/stop")
        response.raise_for_status()
        click.echo(f"🛑 Job {job_id} stopped successfully")
    except requests.exceptions.RequestException as e:
        click.echo(f"❌ Error stopping job: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.argument('job_id')
def delete(job_id):
    """Delete a job and its data"""
    if click.confirm(f'Are you sure you want to delete job {job_id}?'):
        try:
            response = requests.delete(f"{API_URL}/jobs/{job_id}")
            response.raise_for_status()
            click.echo(f"🗑️ Job {job_id} deleted successfully")
        except requests.exceptions.RequestException as e:
            click.echo(f"❌ Error deleting job: {e}", err=True)
            sys.exit(1)

@cli.command()
@click.option('--limit', '-l', default=20, help='Number of jobs to show')
def list(limit):
    """List recent crawl jobs"""
    try:
        response = requests.get(f"{API_URL}/jobs?limit={limit}")
        response.raise_for_status()
        jobs = response.json()
        
        if not jobs:
            click.echo("No jobs found")
            return
        
        click.echo(f"\n📋 Recent Jobs (last {limit})")
        click.echo(f"{'='*80}")
        
        for job in jobs:
            status_color = {
                'completed': '✅',
                'running': '🔄',
                'failed': '❌',
                'pending': '⏳'
            }.get(job['status'], '📝')
            
            click.echo(f"{status_color} {job['job_id'][:8]} | "
                      f"{job['status']:10} | "
                      f"Pages: {job['pages_crawled']:4} | "
                      f"URLs: {', '.join(job['seed_urls'][:2])}")
            
    except requests.exceptions.RequestException as e:
        click.echo(f"❌ Error listing jobs: {e}", err=True)
        sys.exit(1)

def monitor_job(job_id: str, output_dir: str):
    """Monitor a job until completion"""
    try:
        while True:
            response = requests.get(f"{API_URL}/jobs/{job_id}")
            response.raise_for_status()
            job = response.json()
            
            # Clear line and show progress
            status = job['status']
            pages = job['pages_crawled']
            total = job['total_pages']
            
            progress = f"Status: {status} | Pages: {pages}/{total}"
            
            if status == 'completed':
                click.echo(f"\n✅ Job completed successfully!")
                # Download results
                click.echo("📥 Downloading results...")
                download.callback(job_id, 'jsonl', 
                                f"{output_dir}/crawl_{job_id}.jsonl", 
                                10000)
                break
            elif status == 'failed':
                click.echo(f"\n❌ Job failed: {job.get('error', 'Unknown error')}")
                break
            elif status == 'stopped':
                click.echo(f"\n🛑 Job stopped")
                break
            
            # Show progress
            click.echo(f"\r{progress}", nl=False)
            time.sleep(2)
            
    except KeyboardInterrupt:
        click.echo("\n\n⚠️ Monitoring stopped")
    except Exception as e:
        click.echo(f"\n❌ Error monitoring job: {e}")

@cli.command()
@click.option('--url', '-u', help='Single URL to crawl')
@click.option('--file', '-f', type=click.File('r'), help='File containing URLs (one per line)')
@click.option('--output', '-o', default='./output', help='Output directory')
def quick(url, file, output):
    """Quick crawl - simple interface for single URLs"""
    urls = []
    
    if url:
        urls.append(url)
    if file:
        urls.extend([line.strip() for line in file if line.strip()])
    
    if not urls:
        click.echo("Please provide a URL with --url or a file with --file")
        return
    
    # Use sensible defaults for quick crawl
    ctx = click.get_current_context()
    ctx.invoke(crawl, urls=urls, depth=2, max_pages=50, output='jsonl',
               chunk_size=512, no_dedupe=False, no_topic=False,
               no_privacy=False, respect_robots=True, wait=True,
               output_dir=output)

if __name__ == '__main__':
    cli()