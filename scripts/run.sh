#!/bin/bash

set -e

echo "🧠 Starting Guild.xyz Strategic Intelligence System..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please run: ./scripts/setup.sh first"
    exit 1
fi

# Check if required environment variables are set
if ! grep -q "TELEGRAM_BOT_TOKEN=" .env || ! grep -q "ANTHROPIC_API_KEY=" .env; then
    echo "❌ Missing required environment variables in .env"
    echo "Please ensure TELEGRAM_BOT_TOKEN and ANTHROPIC_API_KEY are set for CEO strategic interface"
    exit 1
fi

# Check if packages are built
if [ ! -d "packages/telegram-bot/dist" ]; then
    echo "📦 Building strategic intelligence system first..."
    bun run build
fi

echo "🚀 Launching CEO strategic intelligence interface..."
cd packages/telegram-bot && bun run start 