#!/bin/bash

echo "Starting WorkFlowPro application..."

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Run database seed (it will skip if already seeded due to upsert)
echo "Running database seed..."
npx tsx prisma/seed.ts

echo "Database initialization complete!"

# Start the application
echo "Starting Next.js application..."
node server.js