#!/bin/bash

# V-Try.app Development Setup Script
# This script helps set up the development environment

echo "🚀 V-Try.app Development Setup"
echo "================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create API .env file if it doesn't exist
if [ ! -f "api/.env" ]; then
    echo "📝 Creating API environment file..."
    cat > api/.env << 'EOF'
# V-Try.app API Environment Variables - Development

# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database Configuration (PostgreSQL)
# Using Supabase for development - replace with your actual credentials
DATABASE_URL="postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres"

# Redis Configuration
# Using local Redis for development
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="vtry-development-jwt-secret-change-in-production-2024"

# KIE AI Configuration
KIE_AI_API_KEY="your-kie-ai-api-key-here"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="vtry-app-dev-storage"
AWS_REGION="us-east-1"

# CORS Configuration
CORS_ORIGINS="http://localhost:3000,http://localhost:3001,chrome-extension://*"

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW="15 minutes"

# File Upload Limits
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="image/png,image/jpeg,image/jpg,image/webp"

# Development Only
ENABLE_SWAGGER=true
ENABLE_PLAYGROUND=true
LOG_LEVEL="debug"
EOF
    echo "✅ Created api/.env file"
else
    echo "⚠️  api/.env file already exists, skipping..."
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup API dependencies
echo ""
echo "📦 Installing API dependencies..."
cd api && npm install && cd ..

# Setup Prisma
echo ""
echo "🗄️  Setting up Prisma..."
cd api
npx prisma generate
echo "✅ Prisma client generated"
cd ..

# Create docker-compose for development services
if [ ! -f "docker-compose.dev.yml" ]; then
    echo ""
    echo "🐳 Creating Docker Compose for development services..."
    cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: vtry-redis-dev
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: vtry-postgres-dev
    environment:
      POSTGRES_DB: vtry_dev
      POSTGRES_USER: vtry_user
      POSTGRES_PASSWORD: vtry_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
EOF
    echo "✅ Created docker-compose.dev.yml"
else
    echo "⚠️  docker-compose.dev.yml already exists, skipping..."
fi

echo ""
echo "🎉 Development setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit api/.env with your actual database and service credentials"
echo "2. Start development services: docker-compose -f docker-compose.dev.yml up -d"
echo "3. Run database migrations: cd api && npx prisma migrate dev"
echo "4. Start the API server: cd api && npm run dev"
echo "5. Start the worker (in another terminal): cd api && npm run worker"
echo ""
echo "🔗 Useful commands:"
echo "• View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "• Stop services: docker-compose -f docker-compose.dev.yml down"
echo "• Database studio: cd api && npx prisma studio"
echo "• API health check: curl http://localhost:3001/health"
echo ""
echo "📖 Check docs/DEPLOYMENT_GUIDE.md for production deployment"
