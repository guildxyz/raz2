#!/bin/bash

set -e

echo "🔧 Building packages in dependency order..."

# Build shared package first (no dependencies)
echo "📦 Building shared package..."
cd packages/shared
bun run build

# Build claude-api package (depends on shared)
echo "🤖 Building claude-api package..."
cd ../claude-api
bun run build

# Build mcp-server package (depends on shared)
echo "🔧 Building mcp-server package..."
cd ../mcp-server
bun run build

# Build memory-ui package
echo "🌐 Building memory-ui package..."
cd ../memory-ui
bun run build

# Build telegram-bot package (depends on shared and claude-api)
echo "📱 Building telegram-bot package..."
cd ../telegram-bot
bun run build

# Copy UI files to telegram-bot package
echo "📋 Copying UI files to telegram-bot package..."
cd ../../
./scripts/build-ui.sh

echo "✅ All packages built successfully!" 