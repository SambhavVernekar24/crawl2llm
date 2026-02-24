#!/bin/bash

# AI-Ready Crawler Setup Script
set -e

echo "🚀 Setting up AI-Ready Web Crawler..."
echo "====================================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/output
mkdir -p data/vector_store
mkdir -p postgres_data
mkdir -p redis_data
mkdir -p backups

# Set permissions
chmod -R 755 data/

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env not found. Creating from example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - PLEASE UPDATE WITH YOUR VALUES!"
fi

if [ ! -f frontend/.env ]; then
    echo "⚠️  frontend/.env not found. Creating from example..."
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
fi

# Build and start containers
echo "🐳 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Initialize database
echo "🗄️  Initializing database..."
docker-compose exec -T backend python -c "
from app.storage.database import Base, engine
Base.metadata.create_all(bind=engine)
print('✅ Database tables created')
"

# Check if services are running
echo "🔍 Checking service status..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ All services are running!"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo "====================================="
echo "✅ Setup Complete!"
echo ""
echo "📊 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Backup DB: make backup"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Update secrets in backend/.env"
echo "   2. Review and adjust settings"
echo "====================================="