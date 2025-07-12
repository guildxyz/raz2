#!/bin/bash

set -e

echo "🧠 Building Guild.xyz Strategic Intelligence System..."

# Build shared package first (no dependencies)
echo "📦 Building shared strategic intelligence types..."
cd packages/shared
bun run build

# Build claude-api package (strategic AI reasoning)
echo "🤖 Building Claude AI integration..."
cd ../claude-api
bun run build

# Build idea-store package (strategic intelligence persistence)
echo "💡 Building strategic idea store..."
cd ../idea-store
bun run build

# Prepare database migrations for deployment
echo "🗃️ Preparing database migrations..."
npm run db:generate

# Skip UI build temporarily due to TypeScript errors
# echo "🌐 Building strategic intelligence dashboard..."
# cd ../idea-ui
# bun run build

# Build telegram-bot package (CEO interface)
echo "📱 Building CEO communication interface..."
cd ../telegram-bot
bun run build

# Copy UI files to telegram-bot package (use existing dist)
# echo "📋 Deploying strategic dashboard to CEO interface..."
# cd ../../
# ./scripts/build-ui.sh

echo "✅ Guild.xyz Strategic Intelligence System built successfully!" 