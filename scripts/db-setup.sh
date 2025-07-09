#!/bin/bash

set -e

echo "🗃️ Setting up Strategic Intelligence Database..."

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL}" ]; then
    echo "⚠️  DATABASE_URL not set - skipping database setup"
    exit 0
fi

# Navigate to idea-store package
cd packages/idea-store

# Generate migrations if needed
echo "📝 Generating database migrations..."
npm run db:generate

# Run migrations with retry logic
echo "🔄 Running database migrations..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if npm run db:migrate; then
        echo "✅ Database migrations completed successfully!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "❌ Migration attempt $RETRY_COUNT failed. Retrying in 5 seconds..."
        
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            echo "💥 Failed to run migrations after $MAX_RETRIES attempts"
            exit 1
        fi
        
        sleep 5
    fi
done

echo "🎉 Strategic Intelligence Database is ready!" 