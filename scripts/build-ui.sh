#!/bin/bash

set -e

echo "Building Strategic Intelligence Dashboard..."

# Navigate to the project root
cd "$(dirname "$0")/.."

# Build the idea-ui package
echo "Building strategic dashboard..."
cd packages/idea-ui
bun install
bun run build
cd ../..

# Copy the built files to the telegram-bot package
echo "Deploying strategic dashboard to CEO interface..."
rm -rf packages/telegram-bot/ui-dist
cp -r packages/idea-ui/dist packages/telegram-bot/ui-dist

echo "Strategic Intelligence Dashboard built and deployed successfully!"
echo "The dashboard will be served from the CEO strategic interface." 