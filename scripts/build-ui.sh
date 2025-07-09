#!/bin/bash

set -e

echo "Building Memory UI..."

# Navigate to the project root
cd "$(dirname "$0")/.."

# Build the memory-ui package
echo "Building memory-ui package..."
cd packages/memory-ui
bun install
bun run build
cd ../..

# Copy the built files to the telegram-bot package
echo "Copying UI files to telegram-bot package..."
rm -rf packages/telegram-bot/ui-dist
cp -r packages/memory-ui/dist packages/telegram-bot/ui-dist

echo "Memory UI built and copied successfully!"
echo "The UI will be served from the telegram bot web server." 