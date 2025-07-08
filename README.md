# Claude Telegram Bot with MCP Framework

A modern Telegram bot powered by Claude AI with Model Context Protocol (MCP) integration, built with Bun and TypeScript in a monorepo structure.

## Features

- 🤖 **Telegram Bot**: Interactive bot interface with command handling
- 🧠 **Claude AI Integration**: Advanced AI responses with tool calling capabilities
- 🔧 **MCP Framework**: Model Context Protocol for extensible tool integration
- 📦 **Monorepo**: Clean workspace organization with Bun
- ⚡ **TypeScript**: Full type safety and modern development experience

## Project Structure

```
├── packages/
│   ├── telegram-bot/       # Telegram bot implementation
│   ├── claude-api/         # Claude API integration with tool calls
│   ├── mcp-server/         # MCP server with basic tools
│   └── shared/             # Shared utilities and types
├── package.json            # Root workspace configuration
├── tsconfig.json           # TypeScript configuration
└── .env.example           # Environment variables template
```

## Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- Node.js >= 18.0.0
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Anthropic API Key (from [Anthropic Console](https://console.anthropic.com))

## Quick Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd claude-telegram-bot
   bun install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Build and Start**
   ```bash
   ./scripts/setup.sh
   # OR
   bun run setup
   
   # Then start the bot
   bun start
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | ✅ |
| `ANTHROPIC_API_KEY` | Claude API key | ✅ |
| `CLAUDE_MODEL` | Claude model to use | ❌ |
| `MCP_SERVER_PORT` | MCP server port | ❌ |
| `WEATHER_API_KEY` | Weather tool API key | ❌ |

## Available Commands

- `./scripts/setup.sh` - Full project setup (install, build, configure)
- `./scripts/run.sh` - Start the bot with checks
- `bun start` - Start the Telegram bot
- `bun run build` - Build all packages
- `bun run dev` - Development mode with hot reload
- `bun run type-check` - Run TypeScript type checking

## Bot Commands

- `/start` - Initialize the bot
- `/help` - Show available commands
- `/weather <city>` - Get weather information
- `/time` - Get current time
- `/calc <expression>` - Calculate mathematical expressions

## Development

Each package can be developed independently:

```bash
# Work on telegram bot
cd packages/telegram-bot
bun run dev

# Work on MCP server
cd packages/mcp-server
bun run dev
```

## Architecture

The bot uses a modern architecture with:

1. **Telegram Bot** handles user interactions
2. **Claude API** processes messages with tool calling
3. **MCP Server** provides extensible tools
4. **Shared Package** contains common utilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type-check
5. Submit a pull request

## License

MIT License - see LICENSE file for details 