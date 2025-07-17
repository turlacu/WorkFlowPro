#!/bin/bash
set -e

echo "🚀 Setting up WorkFlow Pro development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d database redis minio

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Development environment setup complete!"
echo ""
echo "Available services:"
echo "🌐 App: http://localhost:3000"
echo "🗄️ Database: postgresql://workflowpro:workflowpro123@localhost:5432/workflowpro"
echo "🗂️ MinIO: http://localhost:9001 (admin: minioadmin / minioadmin123)"
echo "⚡ Redis: localhost:6379"
echo ""
echo "To start the development server:"
echo "npm run dev"
echo ""
echo "Test users:"
echo "Admin: admin@workflowpro.com / admin123"
echo "Producer: adrian.doros@workflowpro.com / producer123"
echo "Operator: alina.doncea@workflowpro.com / operator123"