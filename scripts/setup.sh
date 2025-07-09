#!/bin/bash

set -e

echo "🚀 Setting up Claude Telegram Bot..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "📦 Installing dependencies..."
bun install

echo "🔧 Building packages..."
bun run build

echo "📄 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✨ Created .env file from .env.example"
    echo "⚠️  Please edit .env and add your API keys:"
    echo "   - TELEGRAM_BOT_TOKEN: Get from @BotFather on Telegram"
    echo "   - ANTHROPIC_API_KEY: Get from https://console.anthropic.com/"
    echo "   - DATABASE_URL: PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/dbname)"
    echo "   - OPENWEATHER_API_KEY: (Optional) Get from https://openweathermap.org/api"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your API keys"
echo "2. Run: bun start"
echo ""
echo "Available commands:"
echo "  bun start        - Start the bot (includes database migrations)"
echo "  bun run dev      - Development mode with hot reload"
echo "  bun run build    - Build all packages"
echo "  bun run clean    - Clean build artifacts"
echo "  bun run db:migrate - Run database migrations manually"
echo "" 