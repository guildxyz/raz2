#!/bin/bash

set -e

echo "🤖 Starting Claude Telegram Bot..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please run: ./scripts/setup.sh first"
    exit 1
fi

# Check if required environment variables are set
if ! grep -q "TELEGRAM_BOT_TOKEN=" .env || ! grep -q "ANTHROPIC_API_KEY=" .env; then
    echo "❌ Missing required environment variables in .env"
    echo "Please ensure TELEGRAM_BOT_TOKEN and ANTHROPIC_API_KEY are set"
    exit 1
fi

# Check if packages are built
if [ ! -d "packages/telegram-bot/dist" ]; then
    echo "📦 Building packages first..."
    bun run build
fi

echo "🚀 Starting bot..."
cd packages/telegram-bot && bun run start 