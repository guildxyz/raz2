# Raz2 - Claude Telegram Bot with Memory

A sophisticated Telegram bot powered by Claude AI with persistent memory capabilities using Redis Stack and vector search.

## Features

### Core Functionality
- **Claude AI Integration**: Advanced conversational AI with tool support
- **MCP Tool Support**: Extensible tool system (calculator, weather, time, echo)
- **Telegram Bot**: Full-featured Telegram integration
- **Memory System**: Persistent memory with semantic search using Redis Stack
- **TypeScript Monorepo**: Well-structured, type-safe codebase

### Memory Capabilities  
- **Semantic Search**: Find relevant memories using vector similarity
- **Automatic Storage**: Conversations stored automatically
- **Manual Memory**: Save important information with `/remember`
- **Memory Management**: View, search, and manage stored memories
- **Context-Aware**: Retrieves relevant memories for better responses

## Quick Start

### Prerequisites
- Bun or Node.js 18+
- Telegram Bot Token
- Claude API Key (Anthropic)
- Redis Stack (optional, for memory features)
- OpenAI API Key (optional, for memory embeddings)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd raz2

# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Build all packages
bun run build

# Start the bot
bun run start-bot
```

### Environment Variables

#### Required
```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ANTHROPIC_API_KEY=your_anthropic_api_key
```

#### Optional (for enhanced features)
```bash
# Weather functionality
WEATHER_API_KEY=your_openweather_api_key

# Memory functionality (requires both)
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key

# Memory configuration (optional)
MEMORY_INDEX_NAME=memories
EMBEDDING_MODEL=text-embedding-3-small
```

## Memory Commands

When memory is enabled, the bot supports these commands:

- `/memories` - View your stored memories and stats
- `/remember <text>` - Save important information
- `/search <query>` - Search your memories semantically  
- `/forget` - Clear conversation (memories preserved)

## Package Structure

- **`packages/shared`** - Common utilities and types
- **`packages/claude-api`** - Claude AI integration with tool support
- **`packages/mcp-server`** - MCP tool server implementation
- **`packages/telegram-bot`** - Telegram bot with memory integration
- **`packages/memory-store`** - Redis Stack vector memory system

## Memory System Architecture

The memory system uses:
- **Redis Stack**: Vector database with search capabilities
- **OpenAI Embeddings**: Semantic understanding of content
- **Automatic Context**: Relevant memories included in conversations
- **Smart Storage**: Filters meaningful content for storage

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Start in development mode
bun run dev

# Type checking
bun run type-check

# Linting
bun run lint
```

## Deployment

The bot is designed for easy deployment to platforms like Railway, Heroku, or any Docker-compatible environment.

### Railway Deployment
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Docker Support
```bash
# Build Docker image
docker build -t raz2-bot .

# Run with environment file
docker run --env-file .env raz2-bot
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 